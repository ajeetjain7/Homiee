const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Request = require('../models/Request');
const Team = require('../models/Team');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'homiee_super_secret_key_123';

// Helper to extract authenticated user id from header token or query/body
const extractUserId = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.userId || decoded.id;
    } catch {
      // Fall through to query if token verification fails
    }
  }
  return req.query.userId || req.body?.userId || req.body?.fromUserId;
};

// 1. POST /api/requests — Send an Invite to a candidate or Join Request to a team
router.post('/', async (req, res, next) => {
  try {
    const { 
      fromUserId, 
      fromUserName, 
      fromUserEmail,
      toUserId, 
      toUserName, 
      toUserEmail,
      teamId, 
      teamName, 
      psCode, 
      role, 
      type, 
      message 
    } = req.body;

    const callerId = fromUserId || extractUserId(req);

    if (!callerId) {
      return res.status(400).json({ message: 'Sender user ID (fromUserId) is required.' });
    }
    if (!toUserId) {
      return res.status(400).json({ message: 'Recipient user ID (toUserId) is required.' });
    }
    if (!teamId) {
      return res.status(400).json({ message: 'Target team ID is required.' });
    }

    // Resolve team info if not supplied
    let resolvedTeamName = teamName;
    let resolvedPsCode = psCode;
    if (!resolvedTeamName) {
      const t = await Team.findById(teamId);
      if (t) {
        resolvedTeamName = t.name;
        resolvedPsCode = t.psCode;
      }
    }

    // Resolve sender user info and email
    let resolvedSenderName = fromUserName;
    let resolvedFromEmail = fromUserEmail || '';
    if (callerId && mongoose.Types.ObjectId.isValid(callerId)) {
      const sender = await User.findById(callerId);
      if (sender) {
        resolvedSenderName = resolvedSenderName || sender.name;
        resolvedFromEmail = resolvedFromEmail || sender.email;
      }
    }

    // Resolve recipient user info and email
    let resolvedToName = toUserName;
    let resolvedToEmail = toUserEmail || '';
    if (toUserId && mongoose.Types.ObjectId.isValid(toUserId)) {
      const recipient = await User.findById(toUserId);
      if (recipient) {
        resolvedToName = resolvedToName || recipient.name;
        resolvedToEmail = resolvedToEmail || recipient.email;
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
      return res.status(400).json({ message: 'A pending request / invitation already exists for this candidate.' });
    }

    // Check if target candidate is already in 3 squads
    let recipientIds = [toUserId, toUserId.toString()];
    if (mongoose.Types.ObjectId.isValid(toUserId)) {
      recipientIds.push(new mongoose.Types.ObjectId(toUserId));
    }
    if (resolvedToEmail) {
      recipientIds.push(resolvedToEmail.toLowerCase().trim());
    }
    const candidateActiveCount = await Team.countDocuments({
      $or: [
        { leader: { $in: recipientIds } },
        { members: { $in: recipientIds } }
      ]
    });
    if (candidateActiveCount >= 3) {
      return res.status(400).json({ message: 'Limit reached: Candidate is already a member of 3 squads.' });
    }

    const newRequest = await Request.create({
      fromUserId: callerId,
      fromUserName: resolvedSenderName || 'Squad Leader',
      fromUserEmail: (resolvedFromEmail || '').toLowerCase().trim(),
      toUserId,
      toUserName: resolvedToName || 'Innovator',
      toUserEmail: (resolvedToEmail || '').toLowerCase().trim(),
      teamId,
      teamName: resolvedTeamName || 'SIH Squad',
      psCode: resolvedPsCode || 'SIH2026',
      role: role || 'Squad Member',
      type: type || 'invite',
      message: message || 'You have been invited to join our SIH 2026 squad!',
      status: 'pending'
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('❌ [POST /api/requests] Create Request Error:', error);
    next(error);
  }
});

// 2. GET /api/requests/incoming — Fetch incoming pending invites/requests for the user
router.get('/incoming', async (req, res, next) => {
  try {
    const callerId = extractUserId(req);
    const userEmail = req.query.email;
    const userName = req.query.userName;

    if (!callerId && !userEmail && !userName) {
      return res.status(400).json({ message: 'User identification required.' });
    }

    // Collect all possible ID representations for the recipient
    let userIds = [];
    if (callerId) {
      userIds.push(callerId);
      userIds.push(callerId.toString());
      if (mongoose.Types.ObjectId.isValid(callerId)) {
        userIds.push(new mongoose.Types.ObjectId(callerId));
      }
    }

    // Look up User in MongoDB to match ObjectId, email, and name
    if (callerId && mongoose.Types.ObjectId.isValid(callerId)) {
      const u = await User.findById(callerId);
      if (u) {
        userIds.push(u._id);
        userIds.push(u._id.toString());
        if (u.email) userIds.push(u.email.toLowerCase().trim());
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
        if (u.email) userIds.push(u.email.toLowerCase().trim());
      }
      userIds.push(userName.trim());
    }

    // Find pending requests targeting this user
    const orConditions = [
      { toUserId: { $in: userIds } },
      { toUserName: { $in: userIds } },
      { toUserEmail: { $in: userIds } }
    ];
    if (userName) {
      orConditions.push({ toUserName: { $regex: new RegExp(`^${userName.trim()}$`, 'i') } });
    }

    const requests = await Request.find({
      $and: [
        { $or: orConditions },
        { status: 'pending' }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json(requests);
  } catch (error) {
    console.error('❌ [GET /api/requests/incoming] Error:', error);
    next(error);
  }
});

// 3. GET /api/requests/sent — Fetch all sent invites and join requests by the authenticated user
router.get('/sent', async (req, res, next) => {
  try {
    const callerId = extractUserId(req);
    const userEmail = req.query.email;
    const userName = req.query.userName;

    if (!callerId && !userEmail && !userName) {
      return res.status(400).json({ message: 'User identification required.' });
    }

    let userIds = [];
    if (callerId) {
      userIds.push(callerId);
      userIds.push(callerId.toString());
      if (mongoose.Types.ObjectId.isValid(callerId)) {
        userIds.push(new mongoose.Types.ObjectId(callerId));
      }
    }

    // Look up User in MongoDB to gather all identifier aliases (ObjectId, string ID, real Gmail)
    if (callerId && mongoose.Types.ObjectId.isValid(callerId)) {
      const u = await User.findById(callerId);
      if (u) {
        userIds.push(u._id);
        userIds.push(u._id.toString());
        if (u.email) userIds.push(u.email.toLowerCase().trim());
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
        if (u.email) userIds.push(u.email.toLowerCase().trim());
      }
      userIds.push(userName.trim());
    }

    // 1. Find all direct invites and requests sent by this user from Request collection
    const sentDirectRequests = await Request.find({
      $or: [
        { fromUserId: { $in: userIds } },
        { fromUserName: { $in: userIds } },
        { fromUserEmail: { $in: userIds } }
      ]
    }).sort({ createdAt: -1 }).lean();

    // 2. Find any squad join applications sent by this user in Team.requests
    let teamApplications = [];
    try {
      const teamsWithMyApplications = await Team.find({
        'requests.user': { $in: userIds }
      }).select('name psCode requests').lean();

      teamApplications = teamsWithMyApplications.flatMap(t => 
        (t.requests || []).filter(r => userIds.some(uid => (r.user?._id || r.user || '').toString() === uid.toString())).map(r => ({
          _id: r._id,
          teamId: t._id,
          teamName: t.name,
          psCode: t.psCode,
          role: r.role || 'Contributor',
          type: 'join_request',
          message: r.pitchNote || r.proofOfWork || '',
          toUserName: `${t.name} Squad`,
          status: r.status || 'pending',
          createdAt: r.createdAt || new Date()
        }))
      );
    } catch {
      // ignore
    }

    const allSent = [...sentDirectRequests, ...teamApplications].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    res.status(200).json(allSent);
  } catch (error) {
    console.error('❌ [GET /api/requests/sent] Error:', error);
    next(error);
  }
});

// 4. PATCH /api/requests/:id — Accept or reject invitation/request & update squad roster
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, status } = req.body; // 'accept' or 'reject' / 'accepted' or 'rejected'

    const targetAction = (action || status || '').toLowerCase();
    if (targetAction !== 'accept' && targetAction !== 'accepted' && targetAction !== 'reject' && targetAction !== 'rejected') {
      return res.status(400).json({ message: 'Action must be "accept" or "reject".' });
    }

    const requestDoc = await Request.findById(id);
    if (!requestDoc) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    const isAccepting = targetAction === 'accept' || targetAction === 'accepted';
    requestDoc.status = isAccepting ? 'accepted' : 'rejected';
    await requestDoc.save();

    let updatedTeam = null;

    if (isAccepting) {
      // Find the team
      const team = await Team.findById(requestDoc.teamId);
      if (team) {
        if (!team.members) team.members = [];
        if (team.members.length >= (team.maxMembers || 6)) {
          return res.status(400).json({ message: 'Team roster is already full (maximum 6 members).' });
        }

        // Determine which user is joining the team:
        // If it was an 'invite', toUserId is joining
        // If it was a 'join_request', fromUserId is joining
        const joiningUserId = requestDoc.type === 'invite' ? requestDoc.toUserId : requestDoc.fromUserId;

        // Resolve joining user's real DB ObjectId if available
        let memberIdToAdd = joiningUserId;
        if (typeof joiningUserId === 'string' && !mongoose.Types.ObjectId.isValid(joiningUserId)) {
          const userDoc = await User.findOne({ 
            $or: [
              { name: requestDoc.toUserName },
              { email: joiningUserId },
              { email: requestDoc.toUserEmail }
            ] 
          });
          if (userDoc) memberIdToAdd = userDoc._id;
        }

        // Enforce maximum 3 teams per person in total
        let checkIds = [memberIdToAdd, memberIdToAdd.toString()];
        if (mongoose.Types.ObjectId.isValid(memberIdToAdd)) {
          checkIds.push(new mongoose.Types.ObjectId(memberIdToAdd));
        }
        if (requestDoc.toUserEmail) {
          checkIds.push(requestDoc.toUserEmail.toLowerCase().trim());
        }

        const activeTeamCount = await Team.countDocuments({
          $or: [
            { leader: { $in: checkIds } },
            { members: { $in: checkIds } }
          ]
        });

        if (activeTeamCount >= 3) {
          return res.status(400).json({ message: 'Limit reached: User is already a member of 3 teams.' });
        }

        // Add user to team members array if not already present
        const alreadyMember = team.members.some(m => (m?._id || m).toString() === memberIdToAdd.toString());
        if (!alreadyMember) {
          team.members.push(memberIdToAdd);
        }

        // Mark corresponding vacancy as 'Filled'
        if (team.vacancies && team.vacancies.length > 0 && requestDoc.role) {
          const vIdx = team.vacancies.findIndex(
            v => v.roleName.toLowerCase() === requestDoc.role.toLowerCase() && v.status === 'Vacant'
          );
          if (vIdx !== -1) {
            team.vacancies[vIdx].status = 'Filled';
          }
        }

        if (team.members.length >= (team.maxMembers || 6)) {
          team.isOpen = false;
        }

        await team.save();
        updatedTeam = team;
        console.log(`✅ [PATCH /api/requests/:id] User ${memberIdToAdd} successfully added to team ${team.name} roster!`);
      }
    }

    res.status(200).json({
      message: `Request successfully ${requestDoc.status}!`,
      request: requestDoc,
      team: updatedTeam
    });
  } catch (error) {
    console.error('❌ [PATCH /api/requests/:id] Error:', error);
    next(error);
  }
});

module.exports = router;

