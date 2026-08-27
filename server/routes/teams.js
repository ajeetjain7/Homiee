const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Team = require('../models/Team');
const User = require('../models/User');
const Request = require('../models/Request');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Helper to escape regex special characters
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const MAX_TEAMS_PER_USER = 3;

// 1. GET ALL TEAMS (Search, Filters, Exclusion of User's Own Team, Fast Population)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, theme, role, psCode, skills, page = 1, limit = 50 } = req.query;
    let conditions = [];

    // Exclude teams where the current user is leader or already a member
    if (req.user?.userId) {
      conditions.push({
        leader: { $ne: req.user.userId },
        members: { $ne: req.user.userId }
      });
    }

    // General text search (escaped for safety)
    if (search && search.trim() !== '') {
      const cleanSearch = escapeRegex(search.trim());
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
      conditions.push({ psCode: { $regex: escapeRegex(psCode.trim()), $options: 'i' } });
    }

    // Theme filter
    if (theme && theme !== 'All Themes' && theme !== 'All SIH Themes') {
      conditions.push({ sihTheme: theme });
    }

    // Role vacancy filter
    if (role && role !== 'All Open Positions' && role !== 'All Roles') {
      conditions.push({ 'vacancies.roleName': { $regex: escapeRegex(role), $options: 'i' } });
    }

    // Skills filter
    if (skills && skills !== 'All Skills' && skills !== 'All') {
      const skillList = skills.split(',').map(s => escapeRegex(s.trim())).filter(Boolean);
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
    const skipCount = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));

    const teams = await Team.find(query)
      .populate('leader', 'name avatar photoUrl college primaryRole')
      .populate('members', 'name avatar photoUrl primaryRole')
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(Math.min(100, parseInt(limit)))
      .lean();

    res.status(200).json(teams);
  } catch (error) {
    console.error('GET /api/teams error:', error);
    res.status(500).json({ message: 'Failed to fetch teams', error: error.message });
  }
});

// 2. GET /api/teams/my-team & GET /api/teams/team — Confirmed Squad Membership
const handleGetMyTeam = async (req, res) => {
  try {
    const callerId = req.user.userId;

    // Fast indexed query targeting the caller as leader or member
    const teams = await Team.find({
      $or: [
        { leader: callerId },
        { members: callerId }
      ]
    })
      .populate('leader', 'name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar photoUrl')
      .populate('members', 'name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar photoUrl')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ 
      teams: teams || [], 
      team: teams && teams.length > 0 ? teams[0] : null,
      count: teams.length 
    });
  } catch (error) {
    console.error('My Teams Endpoint Error:', error);
    res.status(500).json({ message: 'Failed to fetch your teams.', error: error.message });
  }
};

router.get('/my-team', authenticateToken, handleGetMyTeam);
router.get('/team', authenticateToken, handleGetMyTeam);

// 3. CREATE A NEW TEAM (Allows creating up to 3 squads)
router.post('/create', authenticateToken, async (req, res) => {
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
      criticalSkills 
    } = req.body;

    const callerId = req.user.userId;

    if (!name || !psCode || !problemStatementTitle || !description) {
      return res.status(400).json({ message: 'Team name, PS code, PS title, and description are required.' });
    }

    // Check 3 Teams Limit
    const existingTeamsCount = await Team.countDocuments({
      $or: [
        { leader: callerId },
        { members: callerId }
      ]
    });

    if (existingTeamsCount >= MAX_TEAMS_PER_USER) {
      return res.status(400).json({ 
        message: `Limit Reached: You are already part of ${existingTeamsCount} squads (maximum limit is ${MAX_TEAMS_PER_USER} squads per user).` 
      });
    }

    const leaderDoc = await User.findById(callerId);
    if (!leaderDoc) {
      return res.status(404).json({ message: 'User profile not found.' });
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
      leader: callerId,
      leaderName: leaderDoc.name || 'Team Lead',
      vacancies: vacancies && vacancies.length > 0 ? vacancies : [{ roleName: 'Backend Developer', status: 'Vacant' }],
      criticalSkills: criticalSkills && criticalSkills.length > 0 ? criticalSkills : [{ skillName: 'React', priority: 'CRITICAL' }],
      members: [callerId],
      maxMembers: 6,
      isOpen: true
    });

    const populatedTeam = await Team.findById(newTeam._id)
      .populate('leader', 'name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar photoUrl')
      .populate('members', 'name email college classBranch section year gender primaryRole capabilities technicalSkills sihThemes about github linkedin portfolio leetcodeRating whatsappNumber avatar photoUrl')
      .lean();

    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Create Team Error:', error);
    res.status(500).json({ message: error.message || 'Failed to create team.' });
  }
});

// 4. ATOMIC JOIN REQUEST (Allows joining up to 3 squads)
router.post('/:teamId/request', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { role, pitchNote, proofOfWork } = req.body;
    const callerId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID format.' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    if (!team.isOpen || team.members.length >= (team.maxMembers || 6)) {
      return res.status(400).json({ message: 'Team roster is full (6/6 members).' });
    }

    // 1. Check if user is already a member of THIS squad
    const alreadyInThisTeam = (team.leader && team.leader.toString() === callerId) || 
      (Array.isArray(team.members) && team.members.some(m => m.toString() === callerId));

    if (alreadyInThisTeam) {
      return res.status(400).json({ message: 'You are already a confirmed member of this squad.' });
    }

    // 2. Check total squads joined by caller (Max 3)
    const userTeamsCount = await Team.countDocuments({
      $or: [
        { leader: callerId },
        { members: callerId }
      ]
    });

    if (userTeamsCount >= MAX_TEAMS_PER_USER) {
      return res.status(400).json({ 
        message: `Limit Reached: You are already a confirmed member of ${userTeamsCount} squads (maximum limit is ${MAX_TEAMS_PER_USER}).` 
      });
    }

    // Check existing pending request in Request collection
    const existingReq = await Request.findOne({
      fromUserId: callerId,
      teamId: team._id,
      status: 'pending'
    });

    if (existingReq) {
      return res.status(400).json({ message: 'You already have a pending application for this squad.' });
    }

    const applicant = await User.findById(callerId);

    // Create unified request record
    const newRequest = await Request.create({
      fromUserId: callerId,
      fromUserName: applicant?.name || 'Applicant',
      fromUserEmail: applicant?.email || req.user.email,
      toUserId: team.leader,
      toUserName: team.leaderName || 'Squad Leader',
      teamId: team._id,
      teamName: team.name,
      psCode: team.psCode,
      role: role || applicant?.primaryRole || 'Squad Member',
      type: 'join_request',
      message: pitchNote || `I'd love to join ${team.name} as ${role || 'a contributor'}.`,
      pitchNote: pitchNote || '',
      proofOfWork: proofOfWork || applicant?.github || applicant?.portfolio || '',
      status: 'pending'
    });

    res.status(200).json({ message: 'Join application submitted successfully!', request: newRequest });
  } catch (error) {
    console.error('Join request error:', error);
    res.status(500).json({ message: error.message || 'Failed to send request.' });
  }
});

// 5. ACCEPT OR REJECT JOIN REQUEST (Leader Auth Protected & Max 3 Squads Check)
router.post('/:teamId/request/:requestId/action', authenticateToken, async (req, res) => {
  try {
    const { teamId, requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const callerId = req.user.userId;

    const targetAction = (action || '').toLowerCase();
    if (targetAction !== 'accept' && targetAction !== 'reject') {
      return res.status(400).json({ message: 'Action must be "accept" or "reject".' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    // Authorization: Only the team leader or co-leader can process applicant requests
    const isLeader = team.leader.toString() === callerId;
    const isCoLeader = Array.isArray(team.coLeaders) && team.coLeaders.some(cl => cl.toString() === callerId);
    if (!isLeader && !isCoLeader) {
      return res.status(403).json({ message: 'Only team leaders can accept or reject applicants.' });
    }

    // Find in Request collection
    const requestDoc = await Request.findById(requestId);
    if (!requestDoc) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (targetAction === 'accept') {
      const applicantId = requestDoc.fromUserId;

      // Check if applicant already reached 3 teams
      const applicantTeamsCount = await Team.countDocuments({
        $or: [
          { leader: applicantId },
          { members: applicantId }
        ]
      });

      if (applicantTeamsCount >= MAX_TEAMS_PER_USER) {
        requestDoc.status = 'rejected';
        await requestDoc.save();
        return res.status(400).json({ 
          message: `Applicant has already reached the maximum limit of ${MAX_TEAMS_PER_USER} squads.` 
        });
      }

      // Atomic capacity check and add member
      const updatedTeam = await Team.findOneAndUpdate(
        {
          _id: teamId,
          'members.5': { $exists: false }, // Max 6 members (indices 0-5)
          members: { $ne: applicantId }
        },
        {
          $addToSet: { members: applicantId }
        },
        { returnDocument: 'after' }
      );

      if (!updatedTeam) {
        return res.status(400).json({ message: 'Team roster is already full (6/6 members) or user is already a member.' });
      }

      // If team reaches 6 members, mark isOpen = false
      if (updatedTeam.members.length >= (updatedTeam.maxMembers || 6)) {
        updatedTeam.isOpen = false;
        await updatedTeam.save();
      }

      // Mark matching vacancy as filled
      if (updatedTeam.vacancies && updatedTeam.vacancies.length > 0 && requestDoc.role) {
        const vIdx = updatedTeam.vacancies.findIndex(
          v => v.roleName.toLowerCase() === requestDoc.role.toLowerCase() && v.status === 'Vacant'
        );
        if (vIdx !== -1) {
          updatedTeam.vacancies[vIdx].status = 'Filled';
          await updatedTeam.save();
        }
      }

      requestDoc.status = 'accepted';
      await requestDoc.save();

      // If applicant now reached 3 squads, auto-cancel other pending applications
      if (applicantTeamsCount + 1 >= MAX_TEAMS_PER_USER) {
        await Request.updateMany(
          {
            $or: [
              { fromUserId: applicantId },
              { toUserId: applicantId }
            ],
            _id: { $ne: requestDoc._id },
            status: 'pending'
          },
          {
            $set: { status: 'rejected' }
          }
        );
      }

      return res.status(200).json({ 
        message: 'Applicant accepted and added to squad!', 
        team: updatedTeam 
      });
    } else {
      requestDoc.status = 'rejected';
      await requestDoc.save();
      return res.status(200).json({ message: 'Applicant request declined.' });
    }
  } catch (error) {
    console.error('Request Action Error:', error);
    res.status(500).json({ message: error.message || 'Failed to process request action.' });
  }
});

// 6. KICK MEMBER FROM TEAM (Leader Auth Verified)
router.post('/:teamId/kick', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { targetMemberId } = req.body;
    const callerId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    if (team.leader.toString() !== callerId) {
      return res.status(403).json({ message: 'Only the team leader can remove members.' });
    }

    if (team.leader.toString() === targetMemberId) {
      return res.status(400).json({ message: 'Team leader cannot be removed from the squad.' });
    }

    team.members = team.members.filter(m => m.toString() !== targetMemberId);
    if (team.coLeaders) {
      team.coLeaders = team.coLeaders.filter(cl => cl.toString() !== targetMemberId);
    }
    team.isOpen = true; // Re-open roster space

    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('leader', 'name email avatar college primaryRole')
      .populate('members', 'name email avatar college primaryRole')
      .lean();

    res.status(200).json({ message: 'Member removed from team.', team: updatedTeam });
  } catch (error) {
    console.error('Kick member error:', error);
    res.status(500).json({ message: 'Failed to kick member.', error: error.message });
  }
});

// 7. MAKE CO-LEADER (Leader Auth Verified)
router.post('/:teamId/co-leader', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { targetMemberId } = req.body;
    const callerId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    if (team.leader.toString() !== callerId) {
      return res.status(403).json({ message: 'Only the main leader can promote co-leaders.' });
    }

    if (!team.coLeaders) team.coLeaders = [];
    if (!team.coLeaders.some(cl => cl.toString() === targetMemberId)) {
      team.coLeaders.push(targetMemberId);
    }

    await team.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('leader', 'name email avatar college primaryRole')
      .populate('members', 'name email avatar college primaryRole')
      .lean();

    res.status(200).json({ message: 'Member promoted to Co-Leader!', team: updatedTeam });
  } catch (error) {
    console.error('Co-leader error:', error);
    res.status(500).json({ message: 'Failed to promote member.', error: error.message });
  }
});

// 8. DELETE A TEAM (Leader Auth Verified)
router.delete('/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const callerId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    if (team.leader.toString() !== callerId) {
      return res.status(403).json({ message: 'Only the team leader can delete this team.' });
    }

    await Team.findByIdAndDelete(teamId);
    // Delete associated requests
    await Request.deleteMany({ teamId });

    res.status(200).json({ message: 'Team deleted successfully!' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Failed to delete team.', error: error.message });
  }
});

// 9. GET SQUAD CHAT MESSAGES (Protected — Only Squad Members Can Read)
router.get('/:teamId/messages', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const callerId = req.user.userId;

    const team = await Team.findById(teamId).select('leader members messages').lean();
    if (!team) return res.status(404).json({ message: 'Squad not found.' });

    const isMember = (team.leader && team.leader.toString() === callerId) || 
      (Array.isArray(team.members) && team.members.some(m => m.toString() === callerId));

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this squad.' });
    }

    const formattedMessages = (team.messages || []).map(m => ({
      _id: m._id ? m._id.toString() : `msg_${Date.now()}`,
      teamId,
      message: m.message,
      user: m.user,
      createdAt: m.createdAt || new Date().toISOString()
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages.', error: error.message });
  }
});

// 10. POST SQUAD CHAT MESSAGE (Protected — Only Squad Members Can Send)
router.post('/:teamId/messages', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { message } = req.body;
    const callerId = req.user.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Squad not found.' });

    const isMember = team.leader.toString() === callerId || 
      (Array.isArray(team.members) && team.members.some(m => m.toString() === callerId));

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this squad.' });
    }

    const senderUser = await User.findById(callerId).select('name email avatar photoUrl primaryRole');

    const msgDoc = {
      user: {
        _id: callerId,
        name: senderUser?.name || 'Teammate',
        email: senderUser?.email || '',
        avatar: senderUser?.avatar || senderUser?.photoUrl || '',
        role: senderUser?.primaryRole || 'Member'
      },
      message: message.trim(),
      createdAt: new Date()
    };

    team.messages.push(msgDoc);
    await team.save();

    const savedMsg = team.messages[team.messages.length - 1];

    res.status(201).json({
      _id: savedMsg._id.toString(),
      teamId,
      message: savedMsg.message,
      user: savedMsg.user,
      createdAt: savedMsg.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ message: 'Failed to post message.', error: error.message });
  }
});

module.exports = router;