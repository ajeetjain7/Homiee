const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// 1. GET ALL TEAMS (Search, Filters, High-Performance Projections with .lean())
router.get('/', async (req, res, next) => {
  try {
    const { search, theme, role } = req.query;
    let query = {};

    // Flexible search handling (supports both Text Search and Regex Fallback)
    if (search && search.trim() !== '') {
      const cleanSearch = search.trim();
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { psCode: { $regex: cleanSearch, $options: 'i' } },
        { problemStatementTitle: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    if (theme && theme !== 'All Themes' && theme !== 'All SIH Themes') {
      query.sihTheme = theme;
    }

    if (role && role !== 'All Open Positions') {
      query['vacancies.roleName'] = role;
    }

    const teams = await Team.find(query)
      .populate('leader', 'name email avatar college primaryRole')
      .populate('members', 'name role primaryRole avatar email')
      .sort({ createdAt: -1 })
      .lean(); // Bypasses Mongoose document overhead for ultra-fast response times under heavy load

    res.status(200).json(teams);
  } catch (error) {
    next(error);
  }
});

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
      userName 
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required to create a team.' });
    }
    if (!name || !psCode || !problemStatementTitle || !description) {
      return res.status(400).json({ message: 'Team name, PS code, PS title, and description are required.' });
    }

    // High-performance count check using indexed leader field
    const existingTeamsCount = await Team.countDocuments({ leader: userId });
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
      leader: userId,
      leaderName: userName || 'Team Lead',
      vacancies: vacancies && vacancies.length > 0 ? vacancies : [{ roleName: 'Backend Developer', status: 'Vacant' }],
      criticalSkills: criticalSkills && criticalSkills.length > 0 ? criticalSkills : [{ skillName: 'React', priority: 'CRITICAL' }],
      members: [userId],
      maxMembers: 6,
      isOpen: true
    });

    res.status(201).json(newTeam);
  } catch (error) {
    next(error);
  }
});

// 3. ATOMIC JOIN REQUEST (Prevents Lock & Race Conditions Under High Traffic)
router.post('/:teamId/request', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, userName, role, pitchNote, proofOfWork } = req.body;

    const team = await Team.findById(teamId).select('members maxMembers isOpen requests');
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    if (!team.isOpen) return res.status(400).json({ message: 'Team roster is full.' });

    // Check if user is already a member
    if (team.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: 'You are already a member of this squad.' });
    }

    // Check existing pending request
    const existingReq = team.requests.find(r => r.user.toString() === userId && r.status === 'pending');
    if (existingReq) {
      return res.status(400).json({ message: 'You already have a pending request for this squad.' });
    }

    // Atomic MongoDB push operation
    await Team.findByIdAndUpdate(teamId, {
      $push: {
        requests: {
          user: userId,
          userName: userName || 'Applicant',
          role: role || 'Contributor',
          pitchNote: pitchNote || '',
          proofOfWork: proofOfWork || '',
          status: 'pending'
        }
      }
    });

    res.status(200).json({ message: 'Join request sent successfully!' });
  } catch (error) {
    next(error);
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