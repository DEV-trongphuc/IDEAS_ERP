// d:\GITHUB_SPACE\IDEAS_ERP\backend\scratch\migrate_intake20_via_node.js
const subjectsData = [
  {
    name: "Artificial Intelligence and Machine Learning",
    code: "AIML",
    startDate: "2026-08-11"
  },
  {
    name: "Reinforcement Learning and AI Optimization",
    code: "RLAO",
    startDate: "2026-08-25"
  },
  {
    name: "Digital and Computer Vision",
    code: "DCV",
    startDate: "2026-09-08"
  },
  {
    name: "IoT",
    code: "IOT",
    startDate: "2026-09-22"
  },
  {
    name: "Big Data Analytics",
    code: "BDA",
    startDate: "2026-10-06"
  },
  {
    name: "Economic Forecasting and AI-Driven Market Dynamics",
    code: "EFAD",
    startDate: "2026-10-20"
  },
  {
    name: "Financial Intelligence and Algorithmic Trading",
    code: "FIAT",
    startDate: "2026-11-03"
  },
  {
    name: "AI in Business Decision Making",
    code: "ABDM",
    startDate: "2026-11-17"
  },
  {
    name: "Global AI Policies and Regulatory Frameworks",
    code: "GAPR",
    startDate: "2026-12-01"
  },
  {
    name: "Change Management Strategies for AI Transition",
    code: "CMAS",
    startDate: "2026-12-15"
  },
  {
    name: "AI Innovation and Entrepreneurship",
    code: "AIE",
    startDate: "2026-12-29"
  },
  {
    name: "Advanced Project Management in AI",
    code: "APMA",
    startDate: "2027-01-12"
  }
];

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const subjects = subjectsData.map((sub, index) => {
  const code = sub.code;
  const name = sub.name;
  const start = sub.startDate;
  
  const host_sessions = [
    {
      id: `session_${code}_1`,
      name: "Session 1",
      date: start,
      time_start: "20:00",
      time_end: "22:00",
      lecturer_name: "Giảng Viên: Phúc Demo"
    },
    {
      id: `session_${code}_2`,
      name: "Session 2",
      date: addDays(start, 2),
      time_start: "20:00",
      time_end: "22:00",
      lecturer_name: "Giảng Viên: Phúc Demo"
    },
    {
      id: `session_${code}_3`,
      name: "Session 3",
      date: addDays(start, 7),
      time_start: "20:00",
      time_end: "22:00",
      lecturer_name: "Giảng Viên: Phúc Demo"
    },
    {
      id: `session_${code}_4`,
      name: "Session 4",
      date: addDays(start, 9),
      time_start: "20:00",
      time_end: "22:00",
      lecturer_name: "Giảng Viên: Phúc Demo"
    }
  ];

  const seminars = [
    {
      id: `sem_${code}_1`,
      topic: `Chuyên đề 1: ${name} Fundamentals`,
      date: addDays(start, 5),
      time_slot: "08:30 - 11:30",
      lecturer_id: "38",
      location: "Online / IDEAS"
    },
    {
      id: `sem_${code}_2`,
      topic: `Chuyên đề 2: Advanced ${name}`,
      date: addDays(start, 12),
      time_slot: "08:30 - 11:30",
      lecturer_id: "38",
      location: "Online / IDEAS"
    }
  ];

  const schedules = [
    {
      day_of_week: 3,
      time_start: "20:00",
      time_end: "22:00"
    },
    {
      day_of_week: 5,
      time_start: "20:00",
      time_end: "22:00"
    }
  ];

  return {
    id: `sub_intake20_${String(index + 1).padStart(2, '0')}`,
    code: code,
    name: name,
    duration_weeks: 2,
    lecturer_id: "38",
    schedules: schedules,
    host_sessions: host_sessions,
    seminars: seminars,
    assignments: [
      { name: "Quiz 1", due_week: 1 },
      { name: "Final Assignment", due_week: 2 }
    ]
  };
});

const sqlEscapedJson = JSON.stringify(subjects).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sql = `UPDATE marketing_campaigns SET subjects_json = '${sqlEscapedJson}' WHERE id = 1`;

console.log("SQL generated, length:", sql.length);

async function run() {
  try {
    const url = "https://open.domation.net/ideas/exec_db_query.php?key=Ideas2026";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `sql=${encodeURIComponent(sql)}`
    });
    const result = await response.json();
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error executing query:", error);
  }
}

run();
