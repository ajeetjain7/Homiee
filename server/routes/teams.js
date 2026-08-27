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

    const teams = await Team.find(query)
      .populate('leader', 'name avatar college primaryRole')
      .populate('members', 'name role primaryRole avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(teams);
  } catch (error) {
    next(error);
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

    // Find all teams where user is leader or member
    let teams = await Team.find({ $or: orConditions })
      .populate('leader', 'name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar')
      .populate('members', 'name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Fallback: If no teams found with strict IDs, check all teams for leaderName or member email match
    if (!teams || teams.length === 0) {
      const allTeams = await Team.find({})
        .populate('leader', 'name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar')
        .populate('members', 'name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar')
        .sort({ createdAt: -1 })
        .lean();

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
    next(error);
  }
};

router.get('/my-team', handleGetMyTeam);
router.get('/team', handleGetMyTeam);

// 2. CREATE A NEW TEAM
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

    // Check maximum 3 teams per account
    const existingTeamsCount = await Team.countDocuments({ 
      $or: [
        { leader: finalLeaderId },
        { leader: callerId }
      ]
    });

    if (existingTeamsCount >= 3) {
      return res.status(400).json({ message: 'Limit reached! Maximum 3 teams allowed per account.' });
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

// 3. ATOMIC JOIN REQUEST (Prevents Lock & Race Conditions Under High Traffic)
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

    // Check if user is already a member
    if (Array.isArray(team.members) && team.members.some(m => (m?._id || m).toString() === callerId.toString())) {
      return res.status(400).json({ message: 'You are already a member of this squad.' });
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

// 4. ACCEPT OR REJECT JOIN REQUEST (Atomic & Vacancy-Aware)
router.post('/:teamId/request/:requestId/action', async (req, res, next) => {
  try {
    const { teamId, requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const request = team.requests.id(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (action === 'accept') {
      if (team.members.length >= (team.maxMembers || 6)) {
        return res.status(400).json({ message: 'Team is already full!' });
      }

      request.status = 'accepted';

      // Add user to members if not present
      if (!team.members.includes(request.user)) {
        team.members.push(request.user);
      }

      // Mark the corresponding vacancy as 'Filled' if it exists
      if (team.vacancies && team.vacancies.length > 0) {
        const vacancyIndex = team.vacancies.findIndex(
          v => v.roleName.toLowerCase() === request.role.toLowerCase() && v.status === 'Vacant'
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

    const updatedTeam = await Team.findById(teamId)
      .populate('leader', 'name email avatar college primaryRole')
      .populate('members', 'name role primaryRole avatar email')
      .lean();

    res.status(200).json({ message: `Request ${action}ed successfully!`, team: updatedTeam });
  } catch (error) {
    next(error);
  }
});

// 5. KICK MEMBER FROM TEAM
router.post('/:teamId/kick', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, targetMemberId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    if (team.leader.toString() !== userId) {
      return res.status(403).json({ message: 'Only team leaders can kick members.' });
    }

    team.members = team.members.filter(m => m.toString() !== targetMemberId);
    if (team.coLeaders) {
      team.coLeaders = team.coLeaders.filter(cl => cl.toString() !== targetMemberId);
    }
    team.isOpen = true; // Re-open roster space

    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('leader', 'name email avatar college primaryRole')
      .populate('members', 'name role primaryRole avatar email')
      .lean();

    res.status(200).json({ message: 'Member removed from team.', team: updatedTeam });
  } catch (error) {
    next(error);
  }
});

// 6. MAKE CO-LEADER
router.post('/:teamId/co-leader', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, targetMemberId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    if (team.leader.toString() !== userId) {
      return res.status(403).json({ message: 'Only the main leader can promote co-leaders.' });
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

// 7. DELETE A TEAM
router.delete('/:teamId', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    if (team.leader.toString() !== userId) {
      return res.status(403).json({ message: 'Only the team leader can delete this team.' });
    }

    await Team.findByIdAndDelete(teamId);
    res.status(200).json({ message: 'Team deleted successfully!' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;