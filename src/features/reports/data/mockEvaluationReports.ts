export type ReportVideo = {
  id: string
  title: string
  duration: string
  thumbnailUrl?: string | null
  tag?: string | null
}

export type ReportFocusArea = {
  id: string
  name: string
  score: number
}

export type ReportSkill = {
  id: string
  name: string
  category: string
  score: number
  notes?: string | null
}

export type ReportWorkoutLevel = {
  id: string
  level: number
  title: string
  targetReps: number
  drills: ReportVideo[]
}

export type ReportDataCategory = {
  id: string
  name: string
  subskills: {
    id: string
    name: string
    score: number
  }[]
}

export type EvaluationReport = {
  id: string
  athleteName: string
  evaluatorName: string
  scorecardTemplate: string
  evaluatedAt: string
  evaluationId: string
  focusAreas: ReportFocusArea[]
  skills: ReportSkill[]
  skillVideos: ReportVideo[]
  workouts: ReportWorkoutLevel[]
  dataByCategory: ReportDataCategory[]
}

export const MOCK_EVALUATION_REPORTS: EvaluationReport[] = [
  {
    id: 'report-1001',
    athleteName: 'Jordan Lewis',
    evaluatorName: 'Coach M. Rivera',
    scorecardTemplate: 'Attack Scorecard Template',
    evaluatedAt: '2028-01-07T09:30:00',
    evaluationId: 'eval-1001',
    focusAreas: [
      { id: 'focus-1', name: 'Stick protection', score: 2.5 },
      { id: 'focus-2', name: 'Off-ball movement', score: 3.0 },
      { id: 'focus-3', name: 'Left hand finishing', score: 2.0 },
    ],
    skills: [
      { id: 'skill-1', name: 'Dodging', category: 'Offense', score: 4.0 },
      { id: 'skill-2', name: 'Feeding', category: 'Offense', score: 3.5 },
      { id: 'skill-3', name: 'Shot accuracy', category: 'Offense', score: 3.0 },
      { id: 'skill-4', name: 'Ride effort', category: 'Transition', score: 4.0 },
      { id: 'skill-5', name: 'Ground balls', category: 'Defense', score: 3.0 },
      { id: 'skill-6', name: 'Communication', category: 'Defense', score: 4.5 },
    ],
    skillVideos: [
      {
        id: 'sv-1',
        title: 'Split dodge progression',
        duration: '4:20',
        tag: 'Footwork',
        thumbnailUrl: '/logo-ankor.png',
      },
      {
        id: 'sv-2',
        title: 'Off-ball cuts',
        duration: '3:45',
        tag: 'Movement',
        thumbnailUrl: '/logo-ankor.png',
      },
      {
        id: 'sv-3',
        title: 'Finishing on the run',
        duration: '5:05',
        tag: 'Shooting',
        thumbnailUrl: '/logo-ankor.png',
      },
    ],
    workouts: [
      {
        id: 'lvl-1',
        level: 1,
        title: 'Level 1 - Core fundamentals',
        targetReps: 10,
        drills: [
          {
            id: 'w1-1',
            title: 'Wall ball rhythm',
            duration: '6:00',
            tag: 'Touch',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w1-2',
            title: 'Split dodge footwork',
            duration: '5:15',
            tag: 'Footwork',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w1-3',
            title: 'Catch and shoot',
            duration: '4:40',
            tag: 'Shooting',
            thumbnailUrl: '/logo-ankor.png',
          },
        ],
      },
      {
        id: 'lvl-2',
        level: 2,
        title: 'Level 2 - Change of direction',
        targetReps: 10,
        drills: [
          {
            id: 'w2-1',
            title: 'Hesitation dodge series',
            duration: '5:30',
            tag: 'Footwork',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w2-2',
            title: 'Inside roll finish',
            duration: '4:10',
            tag: 'Shooting',
            thumbnailUrl: '/logo-ankor.png',
          },
        ],
      },
      {
        id: 'lvl-3',
        level: 3,
        title: 'Level 3 - Finishing under pressure',
        targetReps: 10,
        drills: [
          {
            id: 'w3-1',
            title: 'One more passing',
            duration: '6:20',
            tag: 'Passing',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w3-2',
            title: 'Time and space shooting',
            duration: '5:00',
            tag: 'Shooting',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w3-3',
            title: 'Dodge to draw slide',
            duration: '4:50',
            tag: 'Decision',
            thumbnailUrl: '/logo-ankor.png',
          },
        ],
      },
    ],
    dataByCategory: [
      {
        id: 'cat-1',
        name: 'Offense',
        subskills: [
          { id: 'off-1', name: 'Shot placement', score: 3.0 },
          { id: 'off-2', name: 'Feeding vision', score: 3.5 },
          { id: 'off-3', name: 'Finishing through contact', score: 2.5 },
        ],
      },
      {
        id: 'cat-2',
        name: 'Defense',
        subskills: [
          { id: 'def-1', name: 'Approach angle', score: 3.0 },
          { id: 'def-2', name: 'Recovery speed', score: 3.5 },
          { id: 'def-3', name: 'Ground ball control', score: 3.0 },
        ],
      },
      {
        id: 'cat-3',
        name: 'IQ',
        subskills: [
          { id: 'iq-1', name: 'Spacing decisions', score: 3.0 },
          { id: 'iq-2', name: 'Transition reads', score: 3.5 },
        ],
      },
    ],
  },
  {
    id: 'report-1002',
    athleteName: 'Morgan Brooks',
    evaluatorName: 'Coach L. Chen',
    scorecardTemplate: 'Midfield Scorecard Template',
    evaluatedAt: '2027-12-18T16:05:00',
    evaluationId: 'eval-1002',
    focusAreas: [
      { id: 'focus-4', name: 'Two-way stamina', score: 3.0 },
      { id: 'focus-5', name: 'Reset decisions', score: 2.5 },
    ],
    skills: [
      { id: 'skill-7', name: 'Transition speed', category: 'Transition', score: 4.0 },
      { id: 'skill-8', name: 'Ground balls', category: 'Defense', score: 3.5 },
      { id: 'skill-9', name: 'Pick usage', category: 'Offense', score: 3.0 },
      { id: 'skill-10', name: 'Communication', category: 'Leadership', score: 4.0 },
    ],
    skillVideos: [
      {
        id: 'sv-4',
        title: 'Transition outlet drill',
        duration: '4:30',
        tag: 'Transition',
        thumbnailUrl: '/logo-ankor.png',
      },
      {
        id: 'sv-5',
        title: 'Change of direction ladder',
        duration: '3:50',
        tag: 'Footwork',
        thumbnailUrl: '/logo-ankor.png',
      },
    ],
    workouts: [
      {
        id: 'lvl-1b',
        level: 1,
        title: 'Level 1 - Tempo builder',
        targetReps: 10,
        drills: [
          {
            id: 'w1b-1',
            title: 'Scoop and sprint',
            duration: '4:45',
            tag: 'Transition',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w1b-2',
            title: 'Three pass break',
            duration: '5:20',
            tag: 'Passing',
            thumbnailUrl: '/logo-ankor.png',
          },
        ],
      },
      {
        id: 'lvl-2b',
        level: 2,
        title: 'Level 2 - Two-way burst',
        targetReps: 10,
        drills: [
          {
            id: 'w2b-1',
            title: 'Stop-start shuttle',
            duration: '4:10',
            tag: 'Conditioning',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w2b-2',
            title: 'Pick and pop reps',
            duration: '4:30',
            tag: 'Offense',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w2b-3',
            title: 'Recover and slide',
            duration: '3:55',
            tag: 'Defense',
            thumbnailUrl: '/logo-ankor.png',
          },
        ],
      },
    ],
    dataByCategory: [
      {
        id: 'cat-4',
        name: 'Transition',
        subskills: [
          { id: 'tran-1', name: 'Clear execution', score: 3.5 },
          { id: 'tran-2', name: 'Ride pressure', score: 3.0 },
        ],
      },
      {
        id: 'cat-5',
        name: 'Leadership',
        subskills: [
          { id: 'lead-1', name: 'Communication', score: 4.0 },
          { id: 'lead-2', name: 'Composure', score: 3.5 },
        ],
      },
    ],
  },
  {
    id: 'report-1003',
    athleteName: 'Taylor Grant',
    evaluatorName: 'Coach D. Price',
    scorecardTemplate: 'Defense Scorecard Template',
    evaluatedAt: '2027-11-02T11:20:00',
    evaluationId: 'eval-1003',
    focusAreas: [
      { id: 'focus-6', name: 'Foot speed', score: 2.5 },
      { id: 'focus-7', name: 'Stick checks', score: 3.0 },
      { id: 'focus-8', name: 'Slide timing', score: 2.5 },
    ],
    skills: [
      { id: 'skill-11', name: 'Approach angle', category: 'Defense', score: 3.0 },
      { id: 'skill-12', name: 'Recovery step', category: 'Defense', score: 3.5 },
      { id: 'skill-13', name: 'Body positioning', category: 'Defense', score: 3.0 },
      { id: 'skill-14', name: 'Clearing pass', category: 'Transition', score: 3.5 },
    ],
    skillVideos: [
      {
        id: 'sv-6',
        title: 'Closeout footwork',
        duration: '4:05',
        tag: 'Defense',
        thumbnailUrl: '/logo-ankor.png',
      },
      {
        id: 'sv-7',
        title: 'Slide and recover',
        duration: '5:10',
        tag: 'Team defense',
        thumbnailUrl: '/logo-ankor.png',
      },
      {
        id: 'sv-8',
        title: 'Stick check timing',
        duration: '3:40',
        tag: 'Technique',
        thumbnailUrl: '/logo-ankor.png',
      },
    ],
    workouts: [
      {
        id: 'lvl-1c',
        level: 1,
        title: 'Level 1 - Defensive stance',
        targetReps: 10,
        drills: [
          {
            id: 'w1c-1',
            title: 'Mirror footwork',
            duration: '4:25',
            tag: 'Footwork',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w1c-2',
            title: 'Hip turn reps',
            duration: '4:00',
            tag: 'Footwork',
            thumbnailUrl: '/logo-ankor.png',
          },
        ],
      },
      {
        id: 'lvl-2c',
        level: 2,
        title: 'Level 2 - Slide readiness',
        targetReps: 10,
        drills: [
          {
            id: 'w2c-1',
            title: 'Approach and break down',
            duration: '4:15',
            tag: 'Defense',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w2c-2',
            title: 'Recovery sprint',
            duration: '4:35',
            tag: 'Conditioning',
            thumbnailUrl: '/logo-ankor.png',
          },
          {
            id: 'w2c-3',
            title: 'Stick check ladder',
            duration: '3:55',
            tag: 'Technique',
            thumbnailUrl: '/logo-ankor.png',
          },
        ],
      },
    ],
    dataByCategory: [
      {
        id: 'cat-6',
        name: 'On-ball defense',
        subskills: [
          { id: 'defb-1', name: 'Body positioning', score: 3.0 },
          { id: 'defb-2', name: 'Stick discipline', score: 3.0 },
        ],
      },
      {
        id: 'cat-7',
        name: 'Team defense',
        subskills: [
          { id: 'defc-1', name: 'Slide timing', score: 2.5 },
          { id: 'defc-2', name: 'Communication', score: 3.5 },
        ],
      },
    ],
  },
]
