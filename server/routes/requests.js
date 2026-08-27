const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Request = require('../models/Request');
const Team = require('../models/Team');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const MAX_TEAMS_PER_USER = 3;

// 1. POST /api/requests — Send an Invite to a candidate or Join Request to a squad
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      toUserId, 
      teamId, 
      role, 
      type = 'invite', 
      message,
      pitchNote,
      proofOfWork
    } = req.body;

    const callerId = req.user.userId;

    if (!toUserId || !teamId) {
      return res.status(400).json({ message: 'Recipient user ID and team ID are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(toUserId) || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: 'Invalid ID format provided.' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Target squad not found.' });
    }

    if (!team.isOpen || (team.members && team.members.length >= (team.maxMembers || 6))) {
      return res.status(400).json({ message: 'This squad roster is already full (6/6 members).' });
    }

    const sender = await User.findById(callerId);
    const recipient = await User.findById(toUserId);

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found.' });
    }

    if (type === 'invite') {
      // Caller must be squad leader or confirmed member
      const isLeaderOrMember = team.leader.toString() === callerId || 
        (Array.isArray(team.members) && team.members.some(m => m.toString() === callerId));

      if (!isLeaderOrMember) {
        return res.status(403).json({ message: 'Only confirmed squad members can invite new teammates.' });
      }

      // Check if recipient is already in this team
      if (team.members.some(m => m.toString() === toUserId)) {
        return res.status(400).json({ message: `${recipient.name} is already a member of this squad.` });
      }

      // Check if recipient is already in 3 squads
      const recipientTeamsCount = await Team.countDocuments({
        $or: [
          { leader: toUserId },
          { members: toUserId }
        ]
      });

      if (recipientTeamsCount >= MAX_TEAMS_PER_USER) {
        return res.status(400).json({ 
          message: `${recipient.name} is already part of ${recipientTeamsCount} squads (maximum limit is ${MAX_TEAMS_PER_USER}).` 
        });
      }
    } else {
      // Caller is applying to join the squad — check if caller is already in this squad
      if (team.members.some(m => m.toString() === callerId) || team.leader.toString() === callerId) {
        return res.status(400).json({ message: 'You are already part of this squad.' });
      }

      // Check if caller has reached 3 squads
      const callerTeamsCount = await Team.countDocuments({
        $or: [
          { leader: callerId },
          { members: callerId }
        ]
      });

      if (callerTeamsCount >= MAX_TEAMS_PER_USER) {
        return res.status(400).json({ 
          message: `Limit Reached: You are already a confirmed member of ${callerTeamsCount} squads (maximum limit is ${MAX_TEAMS_PER_USER}).` 
        });
      }
    }

    // Check for existing duplicate pending request
    const existing = await Request.findOne({
      fromUserId: callerId,
      toUserId,
      teamId,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({ message: 'A pending request or invitation already exists for this candidate.' });
    }

    const newRequest = await Request.create({
      fromUserId: callerId,
      fromUserName: sender?.name || 'Squad Leader',
      fromUserEmail: sender?.email || req.user.email,
      toUserId,
      toUserName: recipient.name,
      toUserEmail: recipient.email,
      teamId: team._id,
      teamName: team.name,
      psCode: team.psCode,
      role: role || (type === 'invite' ? recipient.primaryRole : sender?.primaryRole) || 'Squad Member',
      type,
      message: message || (type === 'invite' 
        ? `You have been invited to join ${team.name} for SIH 2026!`
        : `I would like to join ${team.name} as a contributor.`),
      pitchNote: pitchNote || '',
      proofOfWork: proofOfWork || sender?.github || sender?.portfolio || '',
      status: 'pending'
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create Request Error:', error);
    res.status(500).json({ message: 'Failed to create request.', error: error.message });
  }
});

// 2. GET /api/requests/incoming — Fetch incoming pending requests/invites for the authenticated user
router.get('/incoming', authenticateToken, async (req, res) => {
  try {
    const callerId = req.user.userId;

    const requests = await Request.find({
      toUserId: callerId,
      status: 'pending'
    })
      .populate('fromUserId', 'name avatar photoUrl college primaryRole technicalSkills capabilities gender')
      .populate('teamId', 'name psCode sihTheme organization vacancies')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(requests);
  } catch (error) {
    console.error('Fetch incoming requests error:', error);
    res.status(500).json({ message: 'Failed to fetch incoming requests.', error: error.message });
  }
});

// 3. GET /api/requests/sent — Fetch all sent invites & applications by the authenticated user
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const callerId = req.user.userId;

    const sentRequests = await Request.find({
      fromUserId: callerId
    })
      .populate('toUserId', 'name avatar photoUrl college primaryRole')
      .populate('teamId', 'name psCode sihTheme')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(sentRequests);
  } catch (error) {
    console.error('Fetch sent requests error:', error);
    res.status(500).json({ message: 'Failed to fetch sent requests.', error: error.message });
  }
});

// 4. PATCH /api/requests/:id — Accept or reject invitation/request (Supports up to 3 squads)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, status } = req.body;
    const callerId = req.user.userId;

    const targetAction = (action || status || '').toLowerCase();
    if (targetAction !== 'accept' && targetAction !== 'accepted' && targetAction !== 'reject' && targetAction !== 'rejected') {
      return res.status(400).json({ message: 'Action must be "accept" or "reject".' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID format.' });
    }

    const requestDoc = await Request.findById(id);
    if (!requestDoc) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Authorization: Only the recipient can accept or reject the request
    if (requestDoc.toUserId.toString() !== callerId) {
      return res.status(403).json({ message: 'You are not authorized to respond to this request.' });
    }

    const isAccepting = targetAction === 'accept' || targetAction === 'accepted';

    if (isAccepting) {
      const joiningUserId = requestDoc.type === 'invite' ? requestDoc.toUserId : requestDoc.fromUserId;

      // Check if joining user already joined 3 squads
      const joiningTeamsCount = await Team.countDocuments({
        $or: [
          { leader: joiningUserId },
          { members: joiningUserId }
        ]
      });

      if (joiningTeamsCount >= MAX_TEAMS_PER_USER) {
        requestDoc.status = 'rejected';
        await requestDoc.save();
        return res.status(400).json({ 
          message: `User is already part of ${joiningTeamsCount} squads (maximum limit is ${MAX_TEAMS_PER_USER}).` 
        });
      }

      // Atomically add member to team with max capacity check
      const updatedTeam = await Team.findOneAndUpdate(
        {
          _id: requestDoc.teamId,
          'members.5': { $exists: false }, // Capacity maximum 6 (indexes 0-5)
          members: { $ne: joiningUserId }
        },
        {
          $addToSet: { members: joiningUserId }
        },
        { returnDocument: 'after' }
      );

      if (!updatedTeam) {
        requestDoc.status = 'rejected';
        await requestDoc.save();
        return res.status(400).json({ message: 'Squad roster is already full (6/6 members) or user is already a member.' });
      }

      // Close squad if 6 members reached
      if (updatedTeam.members.length >= (updatedTeam.maxMembers || 6)) {
        updatedTeam.isOpen = false;
        await updatedTeam.save();
      }

      // Mark vacancy as filled
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

      // If user has now reached the 3-team limit, auto-cancel other pending requests
      if (joiningTeamsCount + 1 >= MAX_TEAMS_PER_USER) {
        await Request.updateMany(
          {
            $or: [
              { fromUserId: joiningUserId },
              { toUserId: joiningUserId }
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
        message: `🎉 Successfully joined squad ${updatedTeam.name}!`,
        request: requestDoc,
        team: updatedTeam
      });
    } else {
      requestDoc.status = 'rejected';
      await requestDoc.save();

      return res.status(200).json({
        message: 'Request declined.',
        request: requestDoc
      });
    }
  } catch (error) {
    console.error('Request Action Error:', error);
    res.status(500).json({ message: 'Failed to process request action.', error: error.message });
  }
});

module.exports = router;
