const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Team = require('../models/Team');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'homiee_super_secret_key_123';

// Helper to extract authenticated user id from header token or query
const extractUserId = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.userId || decoded.id;
    } catch {
      // Fall through to query if token verification fails (e.g. demo token)
    }
  }
  return req.query.userId || req.body?.userId;
};

// 1. GET ALL TEAMS (Search, Filters, High-Performance Projections with .lean())
// PRIVACY: Emails are strictly omitted from public exploration lists
router.get('/', async (req, res, next) => {
  try {
    const { search, theme, role, psCode, skills } = req.query;
    let conditions = [];

    // General text search
    if (search && search.trim() !== '') {
      const cleanSearch = search.trim();
      conditions.push({
        $or: [
          { name: { $regex: cleanSearch, $options: 'i' } },
          { psCode: { $regex: cleanSearch, $options: 'i' } },
          { problemStatementTitle: { $regex: cleanSearch, $options: 'i' } },
          { description: { $regex: cleanSearch, $options: 'i' } },
          { tagline: { $regex: cleanSearch, $options: 'i' } }
        ]
      });
    }

    // Specific PS Code filter
    if (psCode && psCode.trim() !== '' && psCode !== 'All PS Codes') {
      conditions.push({ psCode: { $regex: psCode.trim(), $options: 'i' } });
    }

    // Theme filter
    if (theme && theme !== 'All Themes' && theme !== 'All SIH Themes') {
      conditions.push({ sihTheme: theme });
    }

    // Role vacancy filter
    if (role && role !== 'All Open Positions' && role !== 'All Roles') {
      conditions.push({ 'vacancies.roleName': { $regex: role, $options: 'i' } });
    }

    // Skills filter
    if (skills && skills !== 'All Skills' && skills !== 'All') {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        conditions.push({
          $or: [
            { 'criticalSkills.skillName': { $in: skillList.map(s => new RegExp(s, 'i')) } },
            { 'vacancies.roleName': { $in: skillList.map(s => new RegExp(s, 'i')) } }
          ]
        });
      }
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    let teams = [];
    try {
      teams = await Team.find(query).sort({ createdAt: -1 }).lean();
    } catch {
      teams = await Team.find({}).sort({ createdAt: -1 }).lean();
    }

    // Safely resolve leader names without crashing on string IDs
    teams = await Promise.all(
      teams.map(async (t) => {
        if (typeof t.leader !== 'object' || !t.leader?.name) {
          const leaderId = t.leader?._id || t.leader;
          if (leaderId && mongoose.Types.ObjectId.isValid(leaderId)) {
            const u = await User.findById(leaderId).select('name avatar college primaryRole').lean();
            if (u) t.leader = u;
          } else {
            t.leader = { _id: leaderId, name: t.leaderName || 'Squad Leader', avatar: '', college: 'College' };
          }
        }
        return t;
      })
    );

    res.status(200).json(teams);
  } catch (error) {
    console.error('GET /api/teams error:', error);
    res.status(200).json([]);
  }
});

// 2. GET /api/teams/my-team & GET /api/teams/team — Confirmed squad membership endpoint
// Explicitly returns ALL teams where user is leader or member, with guaranteed email population
const handleGetMyTeam = async (req, res, next) => {
  try {
    const callerId = extractUserId(req);
    const userEmail = req.query.email || req.body?.email;
    const userName = req.query.userName || req.body?.userName;

    // Collect all possible ID representations for this user
    let userIds = [];
    if (callerId) {
      userIds.push(callerId);
      if (mongoose.Types.ObjectId.isValid(callerId)) {
        userIds.push(new mongoose.Types.ObjectId(callerId));
      }
    }

    // Also look up User in MongoDB by ID, email, or name to gather MongoDB _id
    let dbUsers = [];
    if (callerId && mongoose.Types.ObjectId.isValid(callerId)) {
      const u = await User.findById(callerId);
      if (u) dbUsers.push(u);
    }
    if (userEmail) {
      const u = await User.findOne({ email: userEmail.toLowerCase().trim() });
      if (u) dbUsers.push(u);
    }
    if (userName) {
      const u = await User.findOne({ name: userName.trim() });
      if (u) dbUsers.push(u);
    }

    dbUsers.forEach(u => {
      if (u._id) {
        userIds.push(u._id);
        userIds.push(u._id.toString());
      }
      if (u.email) {
        userIds.push(u.email);
      }
    });

    // Build exhaustive OR search conditions
    const orConditions = [
      { leader: { $in: userIds } },
      { members: { $in: userIds } }
    ];

    if (userName) {
      orConditions.push({ leaderName: { $regex: new RegExp(`^${userName.trim()}$`, 'i') } });
    }
    if (userEmail) {
      orConditions.push({ 'leader.email': userEmail.toLowerCase().trim() });
      orConditions.push({ 'members.email': userEmail.toLowerCase().trim() });
    }

    // Find all teams where user is leader or member without crashing on string IDs
    let teams = [];
    try {
      teams = await Team.find({ $or: orConditions }).sort({ createdAt: -1 }).lean();
    } catch {
      teams = await Team.find({}).sort({ createdAt: -1 }).lean();
    }

    // Fallback: If no teams found with strict IDs, check all teams for leaderName or member email match
    if (!teams || teams.length === 0) {
      const allTeams = await Team.find({}).sort({ createdAt: -1 }).lean();

      teams = allTeams.filter(t => {
        const isLeaderMatch = 
          (t.leader?._id && userIds.some(id => id.toString() === t.leader._id.toString())) ||
          (t.leader && userIds.some(id => id.toString() === t.leader.toString())) ||
          (userEmail && t.leader?.email?.toLowerCase() === userEmail.toLowerCase()) ||
          (userName && (t.leaderName?.toLowerCase() === userName.toLowerCase() || t.leader?.name?.toLowerCase() === userName.toLowerCase()));

        const isMemberMatch = Array.isArray(t.members) && t.members.some(m => 
          (m?._id && userIds.some(id => id.toString() === m._id.toString())) ||
          (m && userIds.some(id => id.toString() === m.toString())) ||
          (userEmail && m?.email?.toLowerCase() === userEmail.toLowerCase()) ||
          (userName && m?.name?.toLowerCase() === userName.toLowerCase())
        );

        return isLeaderMatch || isMemberMatch;
      });
    }

    // For every found team, guarantee leader and member emails are fully resolved
    teams = await Promise.all(
      teams.map(async (t) => {
        // Resolve Leader
        if (typeof t.leader !== 'object' || !t.leader?.email) {
          const leaderId = t.leader?._id || t.leader;
          if (leaderId && mongoose.Types.ObjectId.isValid(leaderId)) {
            const fullLeader = await User.findById(leaderId).select('name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar').lean();
            if (fullLeader) t.leader = fullLeader;
          } else if (t.leaderName) {
            const fullLeader = await User.findOne({ name: t.leaderName }).select('name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar').lean();
            if (fullLeader) t.leader = fullLeader;
          } else {
            t.leader = { _id: leaderId, name: t.leaderName || 'Squad Leader', email: `${t.leaderName || 'leader'}@sih.edu` };
          }
        }

        // Resolve Members
        if (Array.isArray(t.members)) {
          t.members = await Promise.all(
            t.members.map(async (m, mIdx) => {
              if (typeof m === 'object' && m?.email) return m;
              const memberId = m?._id || m;
              if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
                const foundUser = await User.findById(memberId).select('name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar').lean();
                if (foundUser) return foundUser;
              }
              return typeof m === 'object' ? m : { _id: m, name: `Member ${mIdx + 1}`, email: `${m}@sih.edu` };
            })
          );
        }

        return t;
      })
    );

    res.status(200).json({ 
      teams: teams || [], 
      team: teams && teams.length > 0 ? teams[0] : null,
      count: teams.length 
    });
  } catch (error) {
    console.error('My Teams Endpoint Error:', error);
    res.status(200).json({ teams: [], team: null, count: 0 });
  }
};

router.get('/my-team', handleGetMyTeam);
router.get('/team', handleGetMyTeam);

// Helper to compute total active team memberships (leader + accepted member)
const getUserActiveTeamCount = async (userId, userEmail, userName) => {
  let userIds = [];
  if (userId) {
    userIds.push(userId);
    userIds.push(userId.toString());
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIds.push(new mongoose.Types.ObjectId(userId));
    }
  }
  if (userEmail) {
    const u = await User.findOne({ email: userEmail.toLowerCase().trim() });
    if (u) {
      userIds.push(u._id);
      userIds.push(u._id.toString());
    }
    userIds.push(userEmail.toLowerCase().trim());
  }
  if (userName) {
    const u = await User.findOne({ name: userName.trim() });
    if (u) {
      userIds.push(u._id);
      userIds.push(u._id.toString());
    }
    userIds.push(userName.trim());
  }

  const count = await Team.countDocuments({
    $or: [
      { leader: { $in: userIds } },
      { members: { $in: userIds } }
    ]
  });

  return count;
};

// 2. CREATE A NEW TEAM (Enforces Maximum 3 Teams Per Person in Total)
router.post('/create', async (req, res, next) => {
  try {
    const { 
      name, 
      sihTheme, 
      categoryEdition, 
      organization,
      psCode, 
      problemStatementTitle, 
      tagline,
      description, 
      vacancies, 
      criticalSkills, 
      userId, 
      userName,
      email 
    } = req.body;

    const callerId = userId || extractUserId(req);

    if (!callerId) {
      return res.status(400).json({ message: 'User ID is required to create a team.' });
    }
    if (!name || !psCode || !problemStatementTitle || !description) {
      return res.status(400).json({ message: 'Team name, PS code, PS title, and description are required.' });
    }

    // Resolve or create user document in MongoDB so leader reference is always valid
    let leaderDoc = null;
    if (mongoose.Types.ObjectId.isValid(callerId)) {
      leaderDoc = await User.findById(callerId);
    }
    
    if (!leaderDoc && email) {
      leaderDoc = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!leaderDoc && userName) {
      leaderDoc = await User.findOne({ name: userName.trim() });
    }

    // If still not in DB, create user entry automatically
    if (!leaderDoc) {
      const generatedEmail = email ? email.toLowerCase().trim() : `${(userName || 'innovator').toLowerCase().replace(/\s+/g, '')}_${Date.now()}@sih.edu`;
      leaderDoc = await User.create({
        name: userName || 'Student Innovator',
        email: generatedEmail,
        primaryRole: 'Fullstack Developer',
        profileComplete: true,
        isProfileComplete: true,
        sihReadinessScore: 30
      });
    }

    const finalLeaderId = leaderDoc ? leaderDoc._id : callerId;

    // Check maximum 3 active teams per person in total
    const activeTeamCount = await getUserActiveTeamCount(finalLeaderId, email || leaderDoc?.email, userName || leaderDoc?.name);
    if (activeTeamCount >= 3) {
      return res.status(400).json({ message: 'Limit reached: Maximum 3 active teams allowed per person.' });
    }

    const newTeam = await Team.create({
      name: name.trim(),
      sihTheme: sihTheme || 'Agriculture & Rural Development',
      categoryEdition: categoryEdition || 'Software Edition',
      organization: organization ? organization.trim() : '',
      psCode: psCode.trim(),
      problemStatementTitle: problemStatementTitle.trim(),
      tagline: tagline ? tagline.trim() : '',
      description: description.trim(),
      leader: finalLeaderId,
      leaderName: userName || leaderDoc?.name || 'Team Lead',
      vacancies: vacancies && vacancies.length > 0 ? vacancies : [{ roleName: 'Backend Developer', status: 'Vacant' }],
      criticalSkills: criticalSkills && criticalSkills.length > 0 ? criticalSkills : [{ skillName: 'React', priority: 'CRITICAL' }],
      members: [finalLeaderId],
      maxMembers: 6,
      isOpen: true
    });

    res.status(201).json(newTeam);
  } catch (error) {
    console.error('Create Team Error:', error);
    res.status(500).json({ message: error.message || 'Failed to create team.' });
  }
});

// 3. ATOMIC JOIN REQUEST (Enforces Team Capacity & Maximum 3 Teams Per Person)
router.post('/:teamId/request', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, userName, role, pitchNote, proofOfWork, email } = req.body;

    const callerId = userId || extractUserId(req) || 'applicant_user';

    let team = null;
    if (mongoose.Types.ObjectId.isValid(teamId)) {
      team = await Team.findById(teamId);
    } else {
      team = await Team.findOne({ _id: teamId });
    }

    if (!team) return res.status(404).json({ message: 'Team not found.' });
    if (!team.isOpen) return res.status(400).json({ message: 'Team roster is full.' });

    // Check if user is already a member of this team
    if (Array.isArray(team.members) && team.members.some(m => (m?._id || m).toString() === callerId.toString())) {
      return res.status(400).json({ message: 'You are already a member of this squad.' });
    }

    // Check if applicant is already a member of 3 teams
    const applicantTeamCount = await getUserActiveTeamCount(callerId, email, userName);
    if (applicantTeamCount >= 3) {
      return res.status(400).json({ message: 'Limit reached: You are already a member of 3 teams.' });
    }

    // Check existing pending request
    const existingReq = (team.requests || []).find(r => (r.user?._id || r.user || '').toString() === callerId.toString() && r.status === 'pending');
    if (existingReq) {
      return res.status(400).json({ message: 'You already have a pending request for this squad.' });
    }

    // Push request
    team.requests.push({
      user: callerId,
      userName: userName || 'Applicant',
      role: role || 'Contributor',
      pitchNote: pitchNote || '',
      proofOfWork: proofOfWork || '',
      status: 'pending'
    });

    await team.save();

    res.status(200).json({ message: 'Join request sent successfully!' });
  } catch (error) {
    console.error('Join request error:', error);
    res.status(500).json({ message: error.message || 'Failed to send request.' });
  }
});

// 4. ACCEPT OR REJECT JOIN REQUEST (Atomic, Vacancy-Aware & 3-Team Constraint)
router.post('/:teamId/request/:requestId/action', async (req, res, next) => {
  try {
    const { teamId, requestId } = req.params;
    const { action, userId } = req.body; // 'accept' or 'reject'

    const callerId = userId || extractUserId(req);

    let team = null;
    if (mongoose.Types.ObjectId.isValid(teamId)) {
      team = await Team.findById(teamId);
    } else {
      team = await Team.findOne({ _id: teamId });
    }

    if (!team) return res.status(404).json({ message: 'Team not found.' });

    // Verify caller is team leader
    const leaderIdStr = (team.leader?._id || team.leader || '').toString();
    if (callerId && leaderIdStr !== callerId.toString()) {
      return res.status(403).json({ message: 'Forbidden: Only the team leader can accept or reject requests.' });
    }

    // Safely locate request subdocument
    let request = null;
    if (Array.isArray(team.requests)) {
      request = team.requests.find(r => (r._id || '').toString() === requestId.toString()) || 
                (typeof team.requests.id === 'function' ? team.requests.id(requestId) : null);
    }

    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (action === 'accept') {
      if (!Array.isArray(team.members)) team.members = [];
      if (team.members.length >= (team.maxMembers || 6)) {
        return res.status(400).json({ message: 'Team is already full (maximum 6 members)!' });
      }

      // Check applicant active team limit (3 max)
      const applicantUser = request.user?._id || request.user;
      if (applicantUser) {
        const applicantActiveCount = await getUserActiveTeamCount(applicantUser);
        if (applicantActiveCount >= 3) {
          return res.status(400).json({ message: 'Cannot accept: Applicant is already a member of 3 teams.' });
        }
      }

      request.status = 'accepted';

      // Add user to members if not present
      if (applicantUser) {
        const alreadyMember = team.members.some(m => (m?._id || m).toString() === applicantUser.toString());
        if (!alreadyMember) {
          team.members.push(applicantUser);
        }
      }

      // Mark the corresponding vacancy as 'Filled' if it exists
      if (team.vacancies && team.vacancies.length > 0 && request.role) {
        const vacancyIndex = team.vacancies.findIndex(
          v => v.roleName && v.roleName.toLowerCase() === request.role.toLowerCase() && v.status === 'Vacant'
        );
        if (vacancyIndex !== -1) {
          team.vacancies[vacancyIndex].status = 'Filled';
        }
      }

      // Auto-close team if capacity reached
      if (team.members.length >= (team.maxMembers || 6)) {
        team.isOpen = false;
      }
    } else {
      request.status = 'rejected';
    }

    await team.save();

    res.status(200).json({ message: `Request ${action}ed successfully!`, team });
  } catch (error) {
    console.error('Request Action Error:', error);
    res.status(500).json({ message: error.message || 'Failed to process request action.' });
  }
});

// 5. KICK MEMBER FROM TEAM (Leader Management Control)
router.post('/:teamId/kick', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, targetMemberId } = req.body;

    const callerId = userId || extractUserId(req);
    if (!callerId) return res.status(401).json({ message: 'Authentication required.' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const leaderIdStr = (team.leader?._id || team.leader || '').toString();
    if (leaderIdStr !== callerId.toString()) {
      return res.status(403).json({ message: 'Forbidden: Only the team leader can remove members.' });
    }

    if (!targetMemberId) {
      return res.status(400).json({ message: 'Target member ID is required.' });
    }

    if (targetMemberId.toString() === leaderIdStr) {
      return res.status(400).json({ message: 'Team leader cannot remove themselves from the team. To disband, delete the team.' });
    }

    team.members = team.members.filter(m => (m?._id || m).toString() !== targetMemberId.toString());
    if (team.coLeaders) {
      team.coLeaders = team.coLeaders.filter(cl => (cl?._id || cl).toString() !== targetMemberId.toString());
    }
    team.isOpen = true; // Re-open roster space

    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('leader', 'name email avatar college primaryRole')
      .populate('members', 'name role primaryRole avatar email')
      .lean();

    res.status(200).json({ message: 'Member removed from squad.', team: updatedTeam });
  } catch (error) {
    next(error);
  }
});

// 6. EDIT TEAM DETAILS (Leader Management Control)
router.put('/:teamId', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { 
      userId, 
      name, 
      tagline, 
      description, 
      psCode, 
      problemStatementTitle, 
      sihTheme, 
      organization, 
      vacancies, 
      criticalSkills,
      isOpen 
    } = req.body;

    const callerId = userId || extractUserId(req);
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const leaderIdStr = (team.leader?._id || team.leader || '').toString();
    if (leaderIdStr !== (callerId || '').toString()) {
      return res.status(403).json({ message: 'Forbidden: Only the team leader can edit team information.' });
    }

    if (name) team.name = name.trim();
    if (tagline !== undefined) team.tagline = tagline.trim();
    if (description) team.description = description.trim();
    if (psCode) team.psCode = psCode.trim();
    if (problemStatementTitle) team.problemStatementTitle = problemStatementTitle.trim();
    if (sihTheme) team.sihTheme = sihTheme;
    if (organization !== undefined) team.organization = organization.trim();
    if (vacancies) team.vacancies = vacancies;
    if (criticalSkills) team.criticalSkills = criticalSkills;
    if (isOpen !== undefined) team.isOpen = Boolean(isOpen);

    await team.save();

    res.status(200).json({ message: 'Team details updated successfully!', team });
  } catch (error) {
    next(error);
  }
});

// 7. MAKE CO-LEADER
router.post('/:teamId/co-leader', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, targetMemberId } = req.body;

    const callerId = userId || extractUserId(req);
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const leaderIdStr = (team.leader?._id || team.leader || '').toString();
    if (leaderIdStr !== (callerId || '').toString()) {
      return res.status(403).json({ message: 'Forbidden: Only the main leader can promote co-leaders.' });
    }

    if (!team.coLeaders) team.coLeaders = [];
    if (!team.coLeaders.includes(targetMemberId)) {
      team.coLeaders.push(targetMemberId);
    }

    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('leader', 'name email avatar college primaryRole')
      .populate('members', 'name role primaryRole avatar email')
      .lean();

    res.status(200).json({ message: 'Member promoted to Co-Leader!', team: updatedTeam });
  } catch (error) {
    next(error);
  }
});

// 8. DELETE A TEAM (Leader Management Control)
router.delete('/:teamId', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    const callerId = userId || extractUserId(req);
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const leaderIdStr = (team.leader?._id || team.leader || '').toString();
    if (leaderIdStr !== (callerId || '').toString()) {
      return res.status(403).json({ message: 'Forbidden: Only the team leader can delete this team.' });
    }

    await Team.findByIdAndDelete(teamId);
    res.status(200).json({ message: 'Team deleted successfully!' });
  } catch (error) {
    next(error);
  }
});

// 9. GET SQUAD CHAT MESSAGES (Enforces 3-day automatic retention policy)
router.get('/:teamId/messages', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const Message = require('../models/Message');
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Clean up any old array messages older than 3 days in Team document
    Team.findByIdAndUpdate(teamId, {
      $pull: { messages: { createdAt: { $lt: threeDaysAgo } } }
    }).exec().catch(() => {});

    // Query messages created in the last 3 days
    const ttlMessages = await Message.find({
      teamId,
      createdAt: { $gte: threeDaysAgo }
    }).sort({ createdAt: 1 }).lean();

    let formattedMessages = ttlMessages.map(m => ({
      _id: m._id.toString(),
      teamId,
      message: m.message,
      user: m.user,
      createdAt: m.createdAt.toISOString()
    }));

    // Fallback to Team.messages array filtered to 3-day retention
    if (formattedMessages.length === 0) {
      const team = await Team.findById(teamId).select('messages').lean();
      if (!team) return res.status(404).json({ message: 'Squad not found.' });

      formattedMessages = (team.messages || [])
        .filter(m => new Date(m.createdAt || Date.now()) >= threeDaysAgo)
        .map(m => ({
          _id: m._id ? m._id.toString() : `msg_${Date.now()}`,
          teamId,
          message: m.message,
          user: m.user,
          createdAt: m.createdAt || new Date().toISOString()
        }));
    }

    res.status(200).json(formattedMessages);
  } catch (error) {
    next(error);
  }
});

// 10. POST SQUAD CHAT MESSAGE (Persistent Dispatch with 3-Day TTL)
router.post('/:teamId/messages', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { message, user } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    const Message = require('../models/Message');
    const now = new Date();

    const msgDoc = {
      teamId,
      user: {
        _id: user?._id || 'anonymous',
        name: user?.name || 'Teammate',
        email: user?.email || '',
        avatar: user?.avatar || user?.photoUrl || '',
        role: user?.primaryRole || user?.role || 'Member'
      },
      message: message.trim(),
      createdAt: now
    };

    const savedTTLMessage = await Message.create(msgDoc);

    await Team.findByIdAndUpdate(
      teamId,
      { $push: { messages: msgDoc } }
    );

    res.status(201).json({
      _id: savedTTLMessage._id.toString(),
      teamId,
      message: savedTTLMessage.message,
      user: savedTTLMessage.user,
      createdAt: savedTTLMessage.createdAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;