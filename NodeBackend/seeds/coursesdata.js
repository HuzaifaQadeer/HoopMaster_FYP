// seed.js
require('dotenv').config();
const mongoose = require('mongoose');

// Load models (adjust paths as needed)
const Course = require('./../models/courseModel');
const CourseDrill = require('./../models/coursedrillModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("MongoDB Connected");
    seedDatabase();
  })
  .catch(err => console.error("MongoDB Connection Error:", err));

/**
 * Helper function for intermediate and expert courses.
 * Generates sessions with 14 sessions (or 8 if weekly) using dynamic drill titles and instructions.
 */
function generateSessions(courseType, level, trainingType) {
  // Determine number of sessions based on trainingType
  const sessionCount = trainingType === 'weekly' ? 8 : 14;
  let sessions = [];
  for (let i = 1; i <= sessionCount; i++) {
    let baseTitle = '';
    if (courseType === 'Handles') {
      baseTitle = i <= 7 
        ? (level === 'intermediate' ? "Advanced Stationary Control" : "Elite Full‑Court Ball Handling") 
        : (level === 'intermediate' ? "Advanced Dribbling Progression" : "Elite Dribbling Progression");
    } else if (courseType === 'Finishing') {
      baseTitle = i <= 7 
        ? (level === 'intermediate' ? "Advanced Layup Mechanics" : "Elite Game‑Speed Layup") 
        : (level === 'intermediate' ? "Advanced Finishing Progression" : "Elite Finishing Progression");
    } else if (courseType === 'Shooting') {
      baseTitle = i <= 7 
        ? (level === 'intermediate' ? "Advanced Form Shooting" : "Elite Game‑Speed Form Shooting")
        : (level === 'intermediate' ? "Advanced Shooting Progression" : "Elite Shooting Progression");
    }
    sessions.push({
      sessionNumber: i,
      sessionTitle: baseTitle,
      drills: [
        {
          order: 1,
          title: courseType === 'Handles'
            ? (level === 'intermediate' ? "Right‑Hand Advanced Dribble" : "Right‑Hand Elite Dribble")
            : courseType === 'Finishing'
              ? (level === 'intermediate' ? "Advanced Right‑Side Layup" : "Elite Right‑Side Layup")
              : (level === 'intermediate' ? "Close‑Range Advanced Form Shooting" : "Close‑Range Elite Form Shooting"),
          instructions: [
            level === 'intermediate'
              ? "Assume an athletic stance and dribble for 40 seconds with a behind‑the‑back flick every 10 seconds."
              : "Adopt a dynamic stance and dribble full‑court while executing a behind‑the‑back move on the return.",
            "Maintain precise control and smooth transitions throughout the drill.",
            "Focus on rapid yet controlled hand switches and movement.",
            "Repeat for 3 sets with a 15‑second rest between sets."
          ]
        },
        {
          order: 2,
          title: courseType === 'Handles'
            ? (level === 'intermediate' ? "Left‑Hand Advanced Dribble" : "Left‑Hand Elite Dribble")
            : courseType === 'Finishing'
              ? (level === 'intermediate' ? "Advanced Left‑Side Layup" : "Elite Left‑Side Layup")
              : (level === 'intermediate' ? "Enhanced Spot Shooting Drill" : "Elite Spot Shooting Drill"),
          instructions: [
            level === 'intermediate'
              ? "Dribble for 40 seconds focusing on smooth lateral movement and control."
              : "Dribble at game speed while maintaining excellent form and quick release.",
            "Emphasize precision in hand transitions and body balance.",
            "Execute the drill with an increased pace compared to basic drills.",
            "Perform 3 sets with minimal rest to simulate game intensity."
          ]
        },
        {
          order: 3,
          title: courseType === 'Handles'
            ? (level === 'intermediate' ? "Alternating Control Challenge" : "Rapid Alternating Crossover Challenge")
            : courseType === 'Finishing'
              ? (level === 'intermediate' ? "Advanced Combo Layup Sequence" : "Elite Combo Layup Sequence")
              : (level === 'intermediate' ? "Quick Release and Movement Drill" : "Elite Quick Release and Movement Drill"),
          instructions: [
            level === 'intermediate'
              ? "Alternate between techniques with minimal pause for a total of 40 seconds."
              : "Alternate moves at full speed, ensuring each transition is deliberate and precise.",
            "Maintain proper form and focus on accuracy during every repetition.",
            "Execute rapid transitions without compromising on control.",
            "Repeat for 3 sets with a 15‑second recovery period."
          ]
        }
      ]
    });
  }
  return sessions;
}

/**
 * The following helper functions generate complete session objects for beginner courses.
 * (Unlike the intermediate/professional courses, these sessions are fully written out.)
 */

// Returns letter A, B, C... for labeling sessions (1 → A, 2 → B, …)
function getLetter(index) {
  return String.fromCharCode(64 + index);
}

// Generate 14 sessions for Beginner Handles Every‑Other‑Day Training
function generateBeginnerHandlesEveryOtherDaySessions() {
  const sessions = [];
  for (let i = 1; i <= 14; i++) {
    sessions.push({
      sessionNumber: i,
      sessionTitle: `Handles Fundamentals ${getLetter(i)}`,
      drills: [
        {
          order: 1,
          title: `Right-Hand Basic Dribble ${i}`,
          instructions: [
            "Assume a balanced stance and begin with a basic right-hand dribble.",
            "Focus on maintaining control and a steady rhythm.",
            "Dribble continuously for 30 seconds.",
            "Repeat for 3 sets with a 20-second rest between sets."
          ]
        },
        {
          order: 2,
          title: `Left-Hand Basic Dribble ${i}`,
          instructions: [
            "Adopt a balanced stance and execute a left-hand dribble.",
            "Emphasize control and proper hand positioning.",
            "Dribble for 30 seconds while maintaining form.",
            "Complete 3 sets with a 20-second rest."
          ]
        },
        {
          order: 3,
          title: `Alternating Dribble Challenge ${i}`,
          instructions: [
            "Alternate dribbling between right and left hands with each bounce.",
            "Keep transitions smooth and maintain a controlled pace.",
            "Perform continuously for 30 seconds.",
            "Do 3 sets with a 20-second break between sets."
          ]
        }
      ]
    });
  }
  return sessions;
}

// Generate 8 sessions for Beginner Handles Weekly Training
function generateBeginnerHandlesWeeklySessions() {
  const sessions = [];
  for (let i = 1; i <= 8; i++) {
    sessions.push({
      sessionNumber: i,
      sessionTitle: `Extended Fundamentals ${i}`,
      drills: [
        {
          order: 1,
          title: `Extended Right-Hand Dribble ${i}`,
          instructions: [
            "Perform a continuous right-hand dribble focusing on endurance.",
            "Maintain a steady pace for 3 minutes.",
            "Keep proper form and balance throughout.",
            "Repeat for 3 sets with short recovery periods."
          ]
        },
        {
          order: 2,
          title: `Extended Left-Hand Dribble ${i}`,
          instructions: [
            "Execute a continuous left-hand dribble emphasizing control.",
            "Dribble for 3 minutes while maintaining form.",
            "Focus on smooth transitions and balance.",
            "Complete 3 sets with brief rests."
          ]
        },
        {
          order: 3,
          title: `Alternating Extended Dribble Challenge ${i}`,
          instructions: [
            "Alternate between right and left-hand dribbles continuously.",
            "Focus on endurance and maintain control throughout.",
            "Perform for 3 minutes continuously.",
            "Repeat for 3 sets with a short rest between sets."
          ]
        }
      ]
    });
  }
  return sessions;
}

// Generate 14 sessions for Beginner Finishing Daily Training
function generateBeginnerFinishingDailySessions() {
  const sessions = [];
  for (let i = 1; i <= 14; i++) {
    let titlePrefix = i <= 7 ? "Basic" : "Layup Progression";
    sessions.push({
      sessionNumber: i,
      sessionTitle: `${titlePrefix} Layup Fundamentals ${i}`,
      drills: [
        {
          order: 1,
          title: `${titlePrefix} Layup Drill (Right Side) ${i}`,
          instructions: [
            "Position yourself 5 feet from the basket on your right side.",
            "Dribble forward taking 2 controlled steps.",
            "Finish with a right‑hand layup off the backboard.",
            "Perform 10 repetitions and complete 3 sets with a 20-second rest."
          ]
        },
        {
          order: 2,
          title: `${titlePrefix} Layup Drill (Left Side) ${i}`,
          instructions: [
            "Mirror the right‑side drill on the left side.",
            "Dribble forward taking 2 controlled steps.",
            "Finish with a left‑hand layup off the backboard.",
            "Do 10 reps and complete 3 sets with a 20-second rest."
          ]
        },
        {
          order: 3,
          title: `${titlePrefix} Mikan Drill ${i}`,
          instructions: [
            "Stand directly under the basket.",
            "Perform alternating layups with both hands aiming at the backboard square.",
            "Focus on catching the rebound and switching hands immediately.",
            "Alternate for 12 reps per hand over 3 sets."
          ]
        }
      ]
    });
  }
  return sessions;
}

// Generate 14 sessions for Beginner Finishing Every‑Other‑Day Training
function generateBeginnerFinishingEveryOtherDaySessions() {
  const sessions = [];
  for (let i = 1; i <= 14; i++) {
    sessions.push({
      sessionNumber: i,
      sessionTitle: `Finishing Fundamentals ${getLetter(i)}`,
      drills: [
        {
          order: 1,
          title: `Right-Side Layup Drill ${i}`,
          instructions: [
            "Stand 5 feet from the basket on the right side.",
            "Dribble forward and execute a controlled right-hand layup.",
            "Focus on smooth footwork and proper form.",
            "Perform 10 repetitions for 3 sets with a 20-second rest."
          ]
        },
        {
          order: 2,
          title: `Left-Side Layup Drill ${i}`,
          instructions: [
            "Stand 5 feet from the basket on the left side.",
            "Dribble forward and execute a controlled left-hand layup.",
            "Emphasize balance and proper technique.",
            "Complete 10 reps for 3 sets with a 20-second rest."
          ]
        },
        {
          order: 3,
          title: `Mikan Drill Variation ${i}`,
          instructions: [
            "Position yourself under the basket.",
            "Perform alternating layups with quick hand switches.",
            "Focus on timing and accuracy for each rep.",
            "Alternate for 12 reps per hand across 3 sets."
          ]
        }
      ]
    });
  }
  return sessions;
}

// Generate 8 sessions for Beginner Finishing Weekly Training
function generateBeginnerFinishingWeeklySessions() {
  const sessions = [];
  for (let i = 1; i <= 8; i++) {
    sessions.push({
      sessionNumber: i,
      sessionTitle: `Extended Finishing Fundamentals ${i}`,
      drills: [
        {
          order: 1,
          title: `Extended Right-Side Layup Drill ${i}`,
          instructions: [
            "Position 5 feet from the basket on the right side.",
            "Execute a layup with increased emphasis on speed and form.",
            "Focus on fluid motion and a strong finish.",
            "Do 12 reps for 3 sets with minimal rest."
          ]
        },
        {
          order: 2,
          title: `Extended Left-Side Layup Drill ${i}`,
          instructions: [
            "Position on the left side and perform a layup focusing on control.",
            "Emphasize a smooth approach and finishing technique.",
            "Perform 12 repetitions for 3 sets with short rests.",
            "Maintain balance throughout."
          ]
        },
        {
          order: 3,
          title: `Extended Mikan Drill ${i}`,
          instructions: [
            "Stand under the basket and alternate layups rapidly.",
            "Focus on quick rebounds and immediate transitions.",
            "Perform 12 reps per hand for 3 sets.",
            "Keep the pace high and controlled."
          ]
        }
      ]
    });
  }
  return sessions;
}

// Generate 14 sessions for Beginner Shooting Daily Training
function generateBeginnerShootingDailySessions() {
  const sessions = [];
  for (let i = 1; i <= 14; i++) {
    let titlePrefix = i <= 7 ? "Basic" : "Shooting Progression";
    sessions.push({
      sessionNumber: i,
      sessionTitle: `${titlePrefix} Shooting Fundamentals ${i}`,
      drills: [
        {
          order: 1,
          title: `${titlePrefix} Close‑Range Form Shooting ${i}`,
          instructions: [
            "Stand 3 feet from the basket with a balanced stance.",
            "Focus on shooting form and follow‑through on each shot.",
            "Take 15 shots with emphasis on technique.",
            "Complete 3 sets with 20-second rests between sets."
          ]
        },
        {
          order: 2,
          title: `${titlePrefix} Spot Shooting Drill ${i}`,
          instructions: [
            "Mark three spots on the court: left elbow, top of key, and right elbow.",
            "From each spot, shoot 10 jump shots focusing on consistency.",
            "Maintain proper form and rhythm for every shot.",
            "Perform 3 rounds covering all spots."
          ]
        },
        {
          order: 3,
          title: `${titlePrefix} Free Throw Routine ${i}`,
          instructions: [
            "Position yourself at the free‑throw line with your pre‑shot routine.",
            "Focus on balance and a consistent release.",
            "Shoot 10 free throws while keeping steady form.",
            "Complete 3 sets with a 30-second rest between sets."
          ]
        }
      ]
    });
  }
  return sessions;
}

// Generate 14 sessions for Beginner Shooting Every‑Other‑Day Training
function generateBeginnerShootingEveryOtherDaySessions() {
  const sessions = [];
  for (let i = 1; i <= 14; i++) {
    sessions.push({
      sessionNumber: i,
      sessionTitle: `Shooting Fundamentals ${getLetter(i)}`,
      drills: [
        {
          order: 1,
          title: `Close‑Range Form Shooting Drill ${i}`,
          instructions: [
            "Stand 3 feet from the basket with a balanced stance.",
            "Focus on shooting form and quick release.",
            "Take 15 shots with proper technique.",
            "Complete 3 sets with 20-second rests."
          ]
        },
        {
          order: 2,
          title: `Spot Shooting Drill ${i}`,
          instructions: [
            "Mark three shooting spots on the court.",
            "From each spot, shoot 10 jump shots while focusing on consistency.",
            "Maintain proper form for every shot.",
            "Perform 3 rounds with a 20-second rest."
          ]
        },
        {
          order: 3,
          title: `Free Throw Routine Drill ${i}`,
          instructions: [
            "Position at the free‑throw line and follow your routine.",
            "Focus on balance and a smooth follow‑through.",
            "Take 10 free throws steadily.",
            "Repeat for 3 sets with a 30-second break."
          ]
        }
      ]
    });
  }
  return sessions;
}

// Generate 8 sessions for Beginner Shooting Weekly Training
function generateBeginnerShootingWeeklySessions() {
  const sessions = [];
  for (let i = 1; i <= 8; i++) {
    sessions.push({
      sessionNumber: i,
      sessionTitle: `Extended Shooting Fundamentals ${i}`,
      drills: [
        {
          order: 1,
          title: `Extended Close‑Range Shooting Drill ${i}`,
          instructions: [
            "Stand close to the basket and focus on shooting form.",
            "Shoot continuously for 3 minutes emphasizing quick release.",
            "Maintain proper follow‑through on every shot.",
            "Repeat for 3 sets with minimal rest."
          ]
        },
        {
          order: 2,
          title: `Extended Spot Shooting Drill ${i}`,
          instructions: [
            "Mark designated spots on the court and shoot rapidly from each.",
            "Focus on consistency and proper form.",
            "Perform 10 shots per spot for 3 rounds.",
            "Take short breaks between rounds."
          ]
        },
        {
          order: 3,
          title: `Extended Free Throw Routine ${i}`,
          instructions: [
            "Follow your free‑throw routine with emphasis on technique.",
            "Shoot continuously for 2 minutes.",
            "Keep your form consistent throughout.",
            "Repeat for 3 sets with brief rests."
          ]
        }
      ]
    });
  }
  return sessions;
}

/**
 * -------------------------------
 * BEGINNER COURSE OBJECTS
 * -------------------------------
 */

// Beginner – Handles
const beginnerHandlesDaily = {
  title: "Handles Course - Beginner (Daily Training)",
  description: "Focus on basic dribbling skills and ball control using daily sessions over 2 weeks (14 sessions).",
  level: "beginner",
  duration: "2 week",
  frequency: "daily",
  sessions: [
    // Cycle 1: Sessions 1–7
    {
      sessionNumber: 1,
      sessionTitle: "Basic Stationary Dribbling",
      drills: [
        {
          order: 1,
          title: "Right‑Hand Stationary Dribble",
          instructions: [
            "Assume a shoulder‑width stance with slightly bent knees.",
            "Hold the ball in your right hand at waist level.",
            "Dribble continuously for 30 seconds while maintaining posture.",
            "Rest for 15 seconds and complete 3 sets."
          ]
        },
        {
          order: 2,
          title: "Left‑Hand Stationary Dribble",
          instructions: [
            "Adopt the same stance as the right-hand drill.",
            "Secure the ball in your left hand at waist level.",
            "Dribble steadily for 30 seconds ensuring full control.",
            "Perform 3 sets with a 15‑second rest between each set."
          ]
        },
        {
          order: 3,
          title: "Alternating Dribble Challenge",
          instructions: [
            "Stand still while holding the ball in front of you.",
            "Alternate dribbling between right and left hands every 2 bounces.",
            "Maintain this alternating pattern for 30 seconds.",
            "Complete 3 sets with 15‑second rest intervals."
          ]
        }
      ]
    },
    {
      sessionNumber: 2,
      sessionTitle: "Figure‑8 Dribble",
      drills: [
        {
          order: 1,
          title: "Basic Figure‑8 (No Crossover)",
          instructions: [
            "Stand with your feet slightly wider than shoulder width.",
            "Dribble around your right leg in a continuous figure‑8 pattern.",
            "Complete 10 full cycles with steady movement.",
            "Rest for 30 seconds between 3 sets."
          ]
        },
        {
          order: 2,
          title: "Figure‑8 with Arm Extension",
          instructions: [
            "Perform the figure‑8 drill while fully extending your arms at the end of each cycle.",
            "Quickly retract your arms and prepare for the next cycle.",
            "Complete 10 cycles per set with focused form.",
            "Repeat for 3 sets with a 30‑second rest after each set."
          ]
        },
        {
          order: 3,
          title: "Combined Figure‑8 & Crossovers",
          instructions: [
            "Execute the figure‑8 drill and add a quick crossover at the midpoint.",
            "Ensure a smooth hand transition during the crossover.",
            "Complete 8 full cycles maintaining control.",
            "Rest for 30 seconds between 3 sets."
          ]
        }
      ]
    },
    {
      sessionNumber: 3,
      sessionTitle: "Cone Weave Drill",
      drills: [
        {
          order: 1,
          title: "Basic Cone Weave",
          instructions: [
            "Set 5 cones in a straight line with 3-foot spacing.",
            "Dribble with your right hand while weaving between the cones.",
            "Execute gentle crossovers as needed at each cone.",
            "Complete 1 round and repeat for 3 rounds with a 20‑second rest."
          ]
        },
        {
          order: 2,
          title: "Cone Weave with Hand Switch",
          instructions: [
            "Arrange the cones as before and dribble through them.",
            "Switch hands at each cone to maintain even control.",
            "Perform the drill for one complete round.",
            "Repeat for 3 sets with a 20‑second rest after each round."
          ]
        },
        {
          order: 3,
          title: "Timed Cone Weave",
          instructions: [
            "Set a timer for 60 seconds and dribble continuously through the cones.",
            "Maintain focus on control and rapid movement.",
            "Count the number of rounds completed within the time limit.",
            "Perform 2 rounds in total with full recovery between rounds."
          ]
        }
      ]
    },
    {
      sessionNumber: 4,
      sessionTitle: "Alternating High & Low Dribble",
      drills: [
        {
          order: 1,
          title: "High Dribble Phase",
          instructions: [
            "Assume a slightly bent knee stance and hold the ball in your dominant hand.",
            "Dribble at chest height for 10 seconds with controlled power.",
            "Keep your back straight and eyes forward during the drill.",
            "Rest for 5 seconds and repeat for 3 sets."
          ]
        },
        {
          order: 2,
          title: "Low Dribble Phase",
          instructions: [
            "Immediately transition to a low dribble at waist level for 10 seconds.",
            "Focus on keeping the dribble tight and controlled at all times.",
            "Maintain proper form and balance throughout the drill.",
            "Complete 3 sets with a 5‑second rest between sets."
          ]
        },
        {
          order: 3,
          title: "Combined Alternating Phase",
          instructions: [
            "Alternate between a 10‑second high dribble and a 10‑second low dribble.",
            "Ensure smooth and rapid transitions between the two phases.",
            "Maintain the alternating pattern continuously for 60 seconds.",
            "Perform 3 sets with 15‑second rest intervals."
          ]
        }
      ]
    },
    {
      sessionNumber: 5,
      sessionTitle: "Basic Crossover Drill",
      drills: [
        {
          order: 1,
          title: "Crossover Between Markers",
          instructions: [
            "Place two markers 5 feet apart on the floor.",
            "Dribble from the left marker toward the midpoint and execute a quick crossover.",
            "Continue to the right marker and return using the same technique.",
            "Perform 10 crossovers per side for 3 sets with 20‑second rests."
          ]
        },
        {
          order: 2,
          title: "Stationary Crossover",
          instructions: [
            "Stand firmly in place and perform rapid crossovers, switching hands every 2 bounces.",
            "Keep your movements quick and controlled throughout the drill.",
            "Maintain the crossover pattern continuously for 20 seconds.",
            "Repeat for 3 sets with a 20‑second rest interval between sets."
          ]
        },
        {
          order: 3,
          title: "Crossover with Forward Movement",
          instructions: [
            "Dribble forward along a 10‑foot line and execute a crossover at the midpoint.",
            "Turn around quickly and repeat the crossover on the return.",
            "Focus on precise timing and controlled movement during the drill.",
            "Complete 10 repetitions per set for 3 sets."
          ]
        }
      ]
    },
    {
      sessionNumber: 6,
      sessionTitle: "Zigzag Dribble",
      drills: [
        {
          order: 1,
          title: "Basic Zigzag",
          instructions: [
            "Arrange 8 cones in a zigzag pattern over a 20‑foot distance.",
            "Dribble from the first cone to the last, changing direction at each cone.",
            "Focus on smooth directional changes and precise movements.",
            "Complete 1 round for 3 rounds with a 30‑second rest between rounds."
          ]
        },
        {
          order: 2,
          title: "Zigzag with Defensive Cue",
          instructions: [
            "Perform the zigzag drill while imagining a defender at each cone.",
            "Slow down briefly at each cone before accelerating again.",
            "Focus on controlled deceleration and rapid acceleration.",
            "Repeat for 3 rounds with consistent form."
          ]
        },
        {
          order: 3,
          title: "Zigzag with Hand Switch at Each Cone",
          instructions: [
            "Dribble through the cones and switch your dribbling hand at every cone.",
            "Ensure that each hand switch is deliberate and controlled.",
            "Maintain a steady pace throughout the drill.",
            "Perform 3 rounds with appropriate rest intervals."
          ]
        }
      ]
    },
    {
      sessionNumber: 7,
      sessionTitle: "Combo Fundamentals Review",
      drills: [
        {
          order: 1,
          title: "Combo Stationary Dribble",
          instructions: [
            "Stand in place and dribble low for 20 seconds.",
            "Immediately perform 10 rapid crossovers with controlled speed.",
            "Follow with 10 seconds of high dribble to finish the cycle.",
            "Repeat the entire cycle 3 times with a 30‑second rest between cycles."
          ]
        },
        {
          order: 2,
          title: "Combo Zigzag",
          instructions: [
            "Execute the basic zigzag drill as described in Session 6.",
            "Immediately perform 5 rapid crossovers in place at the end of the zigzag.",
            "Focus on maintaining smooth transitions during the drill.",
            "Perform 3 rounds with short rest intervals."
          ]
        },
        {
          order: 3,
          title: "Timed Multi‑Move Challenge",
          instructions: [
            "Set a timer for 90 seconds and combine any three of the learned moves.",
            "Maintain continuous movement and proper form throughout.",
            "Focus on seamless transitions between the moves.",
            "Complete 3 rounds of this challenge with full effort."
          ]
        }
      ]
    }
  ]
};

const beginnerHandlesEveryOtherDay = {
  title: "Handles Course - Beginner (Every-Other-Day Training)",
  description: "Develop fundamental ball handling skills with gradual progression over 4 weeks (14 sessions) on an every‑other‑day schedule.",
  level: "beginner",
  duration: "1 month",
  frequency: "every 2 days",
  sessions: generateBeginnerHandlesEveryOtherDaySessions()
};

const beginnerHandlesWeekly = {
  title: "Handles Course - Beginner (Weekly Training)",
  description: "Enhance ball handling endurance with extended sessions over 2 months (8 sessions) on a weekly schedule.",
  level: "beginner",
  duration: "2 months",
  frequency: "weekly",
  sessions: generateBeginnerHandlesWeeklySessions()
};

// Beginner – Finishing
const beginnerFinishingDaily = {
  title: "Finishing Course - Beginner (Daily Training)",
  description: "Master basic layup and finishing techniques with daily sessions over 2 weeks (14 sessions).",
  level: "beginner",
  duration: "2 week",
  frequency: "daily",
  sessions: generateBeginnerFinishingDailySessions()
};

const beginnerFinishingEveryOtherDay = {
  title: "Finishing Course - Beginner (Every-Other-Day Training)",
  description: "Develop finishing skills with gradual progression over 4 weeks (14 sessions) on an every‑other‑day schedule.",
  level: "beginner",
  duration: "1 month",
  frequency: "every 2 days",
  sessions: generateBeginnerFinishingEveryOtherDaySessions()
};

const beginnerFinishingWeekly = {
  title: "Finishing Course - Beginner (Weekly Training)",
  description: "Enhance layup and finishing endurance with extended sessions over 2 months (8 sessions) on a weekly schedule.",
  level: "beginner",
  duration: "2 months",
  frequency: "weekly",
  sessions: generateBeginnerFinishingWeeklySessions()
};

// Beginner – Shooting
const beginnerShootingDaily = {
  title: "Shooting Course - Beginner (Daily Training)",
  description: "Develop proper shooting form, quick release, and jump shot consistency with daily practice over 2 weeks (14 sessions).",
  level: "beginner",
  duration: "2 week",
  frequency: "daily",
  sessions: generateBeginnerShootingDailySessions()
};

const beginnerShootingEveryOtherDay = {
  title: "Shooting Course - Beginner (Every-Other-Day Training)",
  description: "Improve shooting fundamentals with gradual progression over 4 weeks (14 sessions) on an every‑other‑day schedule.",
  level: "beginner",
  duration: "1 month",
  frequency: "every 2 days",
  sessions: generateBeginnerShootingEveryOtherDaySessions()
};

const beginnerShootingWeekly = {
  title: "Shooting Course - Beginner (Weekly Training)",
  description: "Enhance shooting endurance and form with extended sessions over 2 months (8 sessions) on a weekly schedule.",
  level: "beginner",
  duration: "2 months",
  frequency: "weekly",
  sessions: generateBeginnerShootingWeeklySessions()
};

/**
 * -------------------------------
 * INTERMEDIATE COURSE OBJECTS
 * (Using generateSessions for complete session data)
 * -------------------------------
 */

const intermediateHandlesDaily = {
  title: "Handles Course - Intermediate (Daily Training)",
  description: "Build on basic ball handling with increased duration and integrated defensive cues over 2 weeks (14 sessions).",
  level: "intermediate",
  duration: "2 week",
  frequency: "daily",
  sessions: generateSessions("Handles", "intermediate", "daily")
};

const intermediateHandlesEveryOtherDay = {
  title: "Handles Course - Intermediate (Every-Other-Day Training)",
  description: "Enhance advanced dribbling skills with gradual progression over 4 weeks (14 sessions) on an every‑other‑day schedule.",
  level: "intermediate",
  duration: "1 month",
  frequency: "every 2 days",
  sessions: generateSessions("Handles", "intermediate", "every-2-days")
};

const intermediateHandlesWeekly = {
  title: "Handles Course - Intermediate (Weekly Training)",
  description: "Develop endurance and integrated advanced ball handling in extended sessions over 2 months (8 sessions).",
  level: "intermediate",
  duration: "2 months",
  frequency: "weekly",
  sessions: generateSessions("Handles", "intermediate", "weekly")
};

const intermediateFinishingDaily = {
  title: "Finishing Course - Intermediate (Daily Training)",
  description: "Advance your finishing techniques with enhanced layup mechanics over 2 weeks (14 sessions).",
  level: "intermediate",
  duration: "2 week",
  frequency: "daily",
  sessions: generateSessions("Finishing", "intermediate", "daily")
};

const intermediateFinishingEveryOtherDay = {
  title: "Finishing Course - Intermediate (Every-Other-Day Training)",
  description: "Develop advanced finishing skills with progressive layup and combo drills over 4 weeks (14 sessions).",
  level: "intermediate",
  duration: "1 month",
  frequency: "every 2 days",
  sessions: generateSessions("Finishing", "intermediate", "every-2-days")
};

const intermediateFinishingWeekly = {
  title: "Finishing Course - Intermediate (Weekly Training)",
  description: "Enhance finishing endurance with extended, integrated sessions over 2 months (8 sessions).",
  level: "intermediate",
  duration: "2 months",
  frequency: "weekly",
  sessions: generateSessions("Finishing", "intermediate", "weekly")
};

const intermediateShootingDaily = {
  title: "Shooting Course - Intermediate (Daily Training)",
  description: "Refine shooting mechanics and quick release with advanced drills over 2 weeks (14 sessions).",
  level: "intermediate",
  duration: "2 week",
  frequency: "daily",
  sessions: generateSessions("Shooting", "intermediate", "daily")
};

const intermediateShootingEveryOtherDay = {
  title: "Shooting Course - Intermediate (Every-Other-Day Training)",
  description: "Improve shot consistency and reaction time with progressive drills over 4 weeks (14 sessions).",
  level: "intermediate",
  duration: "1 month",
  frequency: "every 2 days",
  sessions: generateSessions("Shooting", "intermediate", "every-2-days")
};

const intermediateShootingWeekly = {
  title: "Shooting Course - Intermediate (Weekly Training)",
  description: "Develop endurance and integrated shooting skills in extended sessions over 2 months (8 sessions).",
  level: "intermediate",
  duration: "2 months",
  frequency: "weekly",
  sessions: generateSessions("Shooting", "intermediate", "weekly")
};

/**
 * -------------------------------
 * PROFESSIONAL (EXPERT) COURSE OBJECTS
 * -------------------------------
 */

const professionalHandlesDaily = {
  title: "Handles Course - Professional (Daily Training)",
  description: "Perform full‑court ball handling at game‑speed under live defensive pressure over 2 weeks (14 sessions).",
  level: "expert",
  duration: "2 week",
  frequency: "daily",
  sessions: generateSessions("Handles", "professional", "daily")
};

const professionalHandlesEveryOtherDay = {
  title: "Handles Course - Professional (Every-Other-Day Training)",
  description: "Master elite ball handling with live pressure in a gradual progression over 4 weeks (14 sessions).",
  level: "expert",
  duration: "1 month",
  frequency: "every 2 days",
  sessions: generateSessions("Handles", "professional", "every-2-days")
};

const professionalHandlesWeekly = {
  title: "Handles Course - Professional (Weekly Training)",
  description: "Integrate elite dribbling techniques in extended, full‑court sessions over 2 months (8 sessions).",
  level: "expert",
  duration: "2 months",
  frequency: "weekly",
  sessions: generateSessions("Handles", "professional", "weekly")
};

const professionalFinishingDaily = {
  title: "Finishing Course - Professional (Daily Training)",
  description: "Execute game‑speed finishing moves under live pressure over 2 weeks (14 sessions).",
  level: "expert",
  duration: "2 week",
  frequency: "daily",
  sessions: generateSessions("Finishing", "professional", "daily")
};

const professionalFinishingEveryOtherDay = {
  title: "Finishing Course - Professional (Every-Other-Day Training)",
  description: "Perform elite finishing drills with live defensive contact in a gradual progression over 4 weeks (14 sessions).",
  level: "expert",
  duration: "1 month",
  frequency: "every 2 days",
  sessions: generateSessions("Finishing", "professional", "every-2-days")
};

const professionalFinishingWeekly = {
  title: "Finishing Course - Professional (Weekly Training)",
  description: "Engage in extended, full‑court finishing circuits under live pressure over 2 months (8 sessions).",
  level: "expert",
  duration: "2 months",
  frequency: "weekly",
  sessions: generateSessions("Finishing", "professional", "weekly")
};

const professionalShootingDaily = {
  title: "Shooting Course - Professional (Daily Training)",
  description: "Perform elite shooting drills at full game‑speed with minimal release time over 2 weeks (14 sessions).",
  level: "expert",
  duration: "2 week",
  frequency: "daily",
  sessions: generateSessions("Shooting", "professional", "daily")
};

const professionalShootingEveryOtherDay = {
  title: "Shooting Course - Professional (Every-Other-Day Training)",
  description: "Refine rapid shooting under live pressure with integrated drills over 4 weeks (14 sessions).",
  level: "expert",
  duration: "1 month",
  frequency: "every 2 days",
  sessions: generateSessions("Shooting", "professional", "every-2-days")
};

const professionalShootingWeekly = {
  title: "Shooting Course - Professional (Weekly Training)",
  description: "Integrate elite shooting skills in extended full‑court sessions under live pressure over 2 months (8 sessions).",
  level: "expert",
  duration: "2 months",
  frequency: "weekly",
  sessions: generateSessions("Shooting", "professional", "weekly")
};

/**
 * ------------------------------------------------------------
 * COMPLETE COURSES DATA ARRAY (ALL LEVELS, TYPES & Frequencies)
 * ------------------------------------------------------------
 */
const coursesData = [
  // Beginner – Handles
  beginnerHandlesDaily,
  beginnerHandlesEveryOtherDay,
  beginnerHandlesWeekly,
  // Beginner – Finishing
  beginnerFinishingDaily,
  beginnerFinishingEveryOtherDay,
  beginnerFinishingWeekly,
  // Beginner – Shooting
  beginnerShootingDaily,
  beginnerShootingEveryOtherDay,
  beginnerShootingWeekly,
  // Intermediate – Handles
  intermediateHandlesDaily,
  intermediateHandlesEveryOtherDay,
  intermediateHandlesWeekly,
  // Intermediate – Finishing
  intermediateFinishingDaily,
  intermediateFinishingEveryOtherDay,
  intermediateFinishingWeekly,
  // Intermediate – Shooting
  intermediateShootingDaily,
  intermediateShootingEveryOtherDay,
  intermediateShootingWeekly,
  // Professional – Handles
  professionalHandlesDaily,
  professionalHandlesEveryOtherDay,
  professionalHandlesWeekly,
  // Professional – Finishing
  professionalFinishingDaily,
  professionalFinishingEveryOtherDay,
  professionalFinishingWeekly,
  // Professional – Shooting
  professionalShootingDaily,
  professionalShootingEveryOtherDay,
  professionalShootingWeekly
];

async function seedDatabase() {
  try {
    // OPTIONAL: Clear existing data
    await Course.deleteMany({});
    await CourseDrill.deleteMany({});
    console.log("Cleared existing courses and drills.");

    // Process each course
    for (const courseData of coursesData) {
      const { sessions, ...courseInfo } = courseData;
      const course = new Course(courseInfo);
      await course.save();
      const courseDrillIds = [];

      // Determine drill type from course title (Handles, Finishing, or Shooting)
      let courseType = "";
      if (course.title.toLowerCase().includes("handles")) {
        courseType = "Handles";
      } else if (course.title.toLowerCase().includes("finishing")) {
        courseType = "Finishing";
      } else if (course.title.toLowerCase().includes("shooting")) {
        courseType = "Shooting";
      }

      // Loop through each session and its drills
      for (const session of sessions) {
        const sessionNumber = session.sessionNumber;
        for (const drill of session.drills) {
          // Combine the instructions into a single text string
          const instructionsText = drill.instructions.join(" ");
          // Create a CourseDrill document
          const courseDrill = new CourseDrill({
            course: course._id,
            title: drill.title,
            instructions: instructionsText,
            order: drill.order,
            session: sessionNumber,
            type: courseType,
            level: course.level
          });
          await courseDrill.save();
          courseDrillIds.push(courseDrill._id);
        }
      }

      // Update course with its drills
      course.coursedrills = courseDrillIds;
      await course.save();
      console.log(`Inserted course: ${course.title}`);
    }

    console.log("Database seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}
