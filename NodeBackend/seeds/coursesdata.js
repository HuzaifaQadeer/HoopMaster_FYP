// seed.js
require('dotenv').config();
const mongoose = require('mongoose');

// Load models (adjust paths as needed)
const Course = require('./models/courseModel');
const CourseDrill = require('./models/coursedrillModel');

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


function generateSessions(courseType, level, trainingType) {
  // Determine number of sessions based on trainingType
  const sessionCount = trainingType === 'weekly' ? 8 : 14;
  let sessions = [];
  for (let i = 1; i <= sessionCount; i++) {
    let baseTitle = '';
    if (courseType === 'Handles') {
      baseTitle = i <= 7 ? (level === 'intermediate' ? "Advanced Stationary Control" : "Elite Full‑Court Ball Handling") 
                          : (level === 'intermediate' ? "Advanced Dribbling Progression" : "Elite Dribbling Progression");
    } else if (courseType === 'Finishing') {
      baseTitle = i <= 7 ? (level === 'intermediate' ? "Advanced Layup Mechanics" : "Elite Game‑Speed Layup") 
                          : (level === 'intermediate' ? "Advanced Finishing Progression" : "Elite Finishing Progression");
    } else if (courseType === 'Shooting') {
      baseTitle = i <= 7 ? (level === 'intermediate' ? "Advanced Form Shooting" : "Elite Game‑Speed Form Shooting")
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


const beginnerHandlesDaily = {
  title: "Handles Course - Beginner (Daily Training)",
  description: "Focus on basic dribbling skills and ball control using daily sessions over 2 weeks (14 sessions).",
  level: "beginner",
  duration: "2 week",
  frequency: "daily",
  sessions: [
    // --- Cycle 1: Sessions 1–7 ---
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
    },
    // --- Cycle 2: Sessions 8–14 (Progression) ---
    {
      sessionNumber: 8,
      sessionTitle: "Basic Stationary Dribbling Progression",
      drills: [
        {
          order: 1,
          title: "Right‑Hand Dribble Progression",
          instructions: [
            "Adopt a wider stance with deeper knee bend to enhance balance.",
            "Dribble with your right hand for 45 seconds while adding 5 lateral steps.",
            "Focus on maintaining full control with increased movement.",
            "Repeat for 3 sets with a 15‑second rest period."
          ]
        },
        {
          order: 2,
          title: "Left‑Hand Dribble Progression",
          instructions: [
            "Assume the same widened stance and dribble for 45 seconds with the left hand.",
            "Integrate lateral movement to increase the drill’s challenge.",
            "Maintain steady control and a consistent pace throughout.",
            "Perform 3 sets with proper rest intervals."
          ]
        },
        {
          order: 3,
          title: "Alternating Dribble Challenge Progression",
          instructions: [
            "Alternate dribbling between hands with a quicker crossover mid-sequence.",
            "Execute the drill for 45 seconds focusing on faster hand switches.",
            "Emphasize precision and speed during each crossover.",
            "Complete 3 sets with a 15‑second rest between sets."
          ]
        }
      ]
    },
    {
      sessionNumber: 9,
      sessionTitle: "Figure‑8 Dribble Progression",
      drills: [
        {
          order: 1,
          title: "Advanced Figure‑8",
          instructions: [
            "Dribble around your leg with a 1‑second pause at full arm extension.",
            "Complete 12 cycles while focusing on smooth motion.",
            "Keep your movements deliberate and controlled.",
            "Perform 3 sets with a 30‑second rest between sets."
          ]
        },
        {
          order: 2,
          title: "Figure‑8 with Quick Crossover",
          instructions: [
            "Incorporate a rapid crossover at the midpoint of each cycle.",
            "Execute 12 cycles ensuring seamless hand transitions.",
            "Focus on timing and accuracy during the crossover.",
            "Repeat for 3 sets with appropriate rest intervals."
          ]
        },
        {
          order: 3,
          title: "Combined Figure‑8 & Crossovers Progression",
          instructions: [
            "Mix figure‑8 dribbling with quick crossovers in a continuous sequence.",
            "Complete 10 cycles with an emphasis on reaction time.",
            "Maintain deliberate and controlled movements throughout.",
            "Perform 3 sets with full recovery between sets."
          ]
        }
      ]
    },
    {
      sessionNumber: 10,
      sessionTitle: "Cone Weave Drill Progression",
      drills: [
        {
          order: 1,
          title: "Enhanced Cone Weave",
          instructions: [
            "Set cones closer together to increase the drill’s difficulty.",
            "Dribble with added lateral movement while weaving between cones.",
            "Focus on rapid directional changes with precision.",
            "Complete 1 round and repeat for 3 sets with a 20‑second rest."
          ]
        },
        {
          order: 2,
          title: "Cone Weave with Reaction Switch",
          instructions: [
            "Dribble through the cones and switch hands upon a partner’s cue.",
            "Ensure each hand switch is executed precisely at the cones.",
            "Maintain a consistent pace despite the added reaction element.",
            "Perform 3 sets with a 20‑second rest between sets."
          ]
        },
        {
          order: 3,
          title: "Timed Cone Weave Challenge",
          instructions: [
            "Dribble continuously through the cones for 60 seconds.",
            "Focus on consistency and rapid movement throughout the drill.",
            "Count the number of complete rounds achieved in the time limit.",
            "Repeat for 2 sets with full recovery between rounds."
          ]
        }
      ]
    },
    {
      sessionNumber: 11,
      sessionTitle: "Alternating High & Low Dribble Progression",
      drills: [
        {
          order: 1,
          title: "Extended High Dribble Phase",
          instructions: [
            "Dribble at a higher pace for 15 seconds at chest height.",
            "Incorporate a slight lateral movement to increase challenge.",
            "Maintain upright posture and consistent form.",
            "Complete 3 sets with brief rest intervals."
          ]
        },
        {
          order: 2,
          title: "Extended Low Dribble Phase",
          instructions: [
            "Switch to a low dribble at waist level for 15 seconds.",
            "Integrate quick lateral shuffles to boost intensity.",
            "Keep the dribble tight and controlled throughout.",
            "Repeat for 3 sets with minimal rest."
          ]
        },
        {
          order: 3,
          title: "Combined Alternating Drill Progression",
          instructions: [
            "Alternate between the high and low phases continuously for 60 seconds.",
            "Incorporate lateral movements during each transition.",
            "Focus on rapid yet controlled transitions between phases.",
            "Perform 3 sets with a 15‑second recovery after each set."
          ]
        }
      ]
    },
    {
      sessionNumber: 12,
      sessionTitle: "Basic Crossover Drill Progression",
      drills: [
        {
          order: 1,
          title: "Enhanced Crossover Between Markers",
          instructions: [
            "Place markers and dribble at increased speed between them.",
            "Execute a rapid crossover at the midpoint with precision.",
            "Focus on smooth, controlled hand transitions.",
            "Perform 10 crossovers per side for 3 sets with rest."
          ]
        },
        {
          order: 2,
          title: "Rapid Stationary Crossover",
          instructions: [
            "Stand firmly and execute rapid crossovers with minimal pause.",
            "Ensure each hand switch is deliberate and controlled.",
            "Maintain the drill continuously for 20 seconds.",
            "Repeat for 3 sets with a 20‑second break between sets."
          ]
        },
        {
          order: 3,
          title: "Crossover with Forward Movement Progression",
          instructions: [
            "Dribble forward along a marked line and execute a quick crossover at midpoint.",
            "Turn around rapidly and repeat the movement.",
            "Focus on increasing speed while maintaining accuracy.",
            "Perform 3 sets with proper rest intervals."
          ]
        }
      ]
    },
    {
      sessionNumber: 13,
      sessionTitle: "Zigzag Dribble Progression",
      drills: [
        {
          order: 1,
          title: "Advanced Zigzag",
          instructions: [
            "Arrange cones in a zigzag formation and dribble through them at increased speed.",
            "Focus on sharp directional changes and precise movements.",
            "Maintain control and balance during each turn.",
            "Complete 1 round for 3 sets with brief rests."
          ]
        },
        {
          order: 2,
          title: "Zigzag with Enhanced Defensive Cue",
          instructions: [
            "Simulate a defender by pausing briefly at each cone before accelerating.",
            "Integrate the defensive cue without losing control.",
            "Ensure each pause is deliberate and timed accurately.",
            "Repeat for 3 rounds with consistent effort."
          ]
        },
        {
          order: 3,
          title: "Zigzag with Hand Switch Progression",
          instructions: [
            "Dribble through the cones while switching hands at every cone at increased speed.",
            "Focus on smooth transitions and maintaining consistent form.",
            "Keep a steady pace and controlled movement throughout.",
            "Perform 3 rounds with appropriate recovery intervals."
          ]
        }
      ]
    },
    {
      sessionNumber: 14,
      sessionTitle: "Combo Fundamentals Review Progression",
      drills: [
        {
          order: 1,
          title: "Progressive Combo Stationary Dribble",
          instructions: [
            "Dribble low for 20 seconds with added lateral movement.",
            "Immediately execute 10 rapid crossovers with increased speed.",
            "Finish with an extended 10‑second high dribble.",
            "Repeat the cycle 3 times with a 30‑second rest between cycles."
          ]
        },
        {
          order: 2,
          title: "Progressive Combo Zigzag",
          instructions: [
            "Perform the advanced zigzag drill as outlined in Session 13.",
            "Immediately complete 5 rapid crossovers in place afterwards.",
            "Focus on smooth transitions despite increased pace.",
            "Repeat for 3 rounds with brief recovery periods."
          ]
        },
        {
          order: 3,
          title: "Timed Multi‑Move Challenge Progression",
          instructions: [
            "Combine any three advanced moves continuously for 90 seconds.",
            "Execute each move with precision under increased pace.",
            "Ensure seamless transitions between all moves.",
            "Complete 3 rounds of this challenge with full intensity."
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
  sessions: [
    // For brevity, the structure is similar to Daily Training but with adjusted drill details.
    // Week 1 – Sessions 1–4:
    {
      sessionNumber: 1,
      sessionTitle: "Handles Fundamentals A",
      drills: [
        {
          order: 1,
          title: "Dual-Hand Stationary Dribble",
          instructions: [
            "Dribble with each hand separately for 30 seconds.",
            "Focus on maintaining a balanced stance and control.",
            "Alternate hands with consistent rhythm.",
            "Complete 3 sets with a 15‑second rest."
          ]
        },
        {
          order: 2,
          title: "Basic Figure‑8 Drill",
          instructions: [
            "Perform a figure‑8 dribble for 10 cycles.",
            "Maintain smooth motion around your leg.",
            "Focus on consistency and control.",
            "Repeat for 3 sets with a 30‑second rest."
          ]
        },
        {
          order: 3,
          title: "Simple Cone Weave",
          instructions: [
            "Weave through 5 cones arranged in a line.",
            "Focus on quick, controlled movements.",
            "Complete 1 round steadily.",
            "Perform 3 rounds with a 20‑second rest."
          ]
        }
      ]
    },
    {
      sessionNumber: 2,
      sessionTitle: "Handles Fundamentals B",
      drills: [
        {
          order: 1,
          title: "Alternating High/Low Dribble",
          instructions: [
            "Dribble high for 30 seconds then switch to low for 30 seconds.",
            "Focus on rapid transitions between high and low dribbles.",
            "Maintain proper form throughout.",
            "Complete 3 sets with a 15‑second rest."
          ]
        },
        {
          order: 2,
          title: "Basic Crossover Drill",
          instructions: [
            "Perform 10 crossovers per side in a controlled manner.",
            "Focus on quick and smooth hand switches.",
            "Maintain consistency across each repetition.",
            "Repeat for 3 sets with a 20‑second rest."
          ]
        },
        {
          order: 3,
          title: "Simple Zigzag Dribble",
          instructions: [
            "Dribble in a zigzag pattern through 8 cones.",
            "Maintain a steady pace and controlled turns.",
            "Complete 1 round with focus on accuracy.",
            "Perform 3 rounds with brief rests."
          ]
        }
      ]
    },
    {
      sessionNumber: 3,
      sessionTitle: "Handles Fundamentals C",
      drills: [
        {
          order: 1,
          title: "Combo Stationary Dribble",
          instructions: [
            "Dribble low for 20 seconds, then perform 10 rapid crossovers.",
            "Finish with 10 seconds of high dribble.",
            "Focus on fluidity and control throughout.",
            "Repeat for 3 cycles."
          ]
        },
        {
          order: 2,
          title: "Figure‑8 with Arm Extension",
          instructions: [
            "Perform a figure‑8 while fully extending your arms at each cycle’s end.",
            "Maintain a controlled pace and focus on form.",
            "Complete 10 cycles steadily.",
            "Perform 3 sets with a 30‑second rest."
          ]
        },
        {
          order: 3,
          title: "Timed Cone Weave",
          instructions: [
            "Dribble through 5 cones continuously for 60 seconds.",
            "Focus on rapid yet controlled movement.",
            "Record the number of rounds completed.",
            "Repeat for 2 rounds with full recovery."
          ]
        }
      ]
    },
    {
      sessionNumber: 4,
      sessionTitle: "Handles Fundamentals D",
      drills: [
        {
          order: 1,
          title: "Zigzag with Hand Switch",
          instructions: [
            "Dribble through a zigzag of cones and switch hands at each cone.",
            "Focus on smooth and accurate transitions.",
            "Maintain a steady pace throughout.",
            "Perform 3 rounds with a short rest."
          ]
        },
        {
          order: 2,
          title: "Stationary Crossover Drill",
          instructions: [
            "Stand in place and perform rapid crossovers for 20 seconds.",
            "Ensure controlled hand transitions every 2 bounces.",
            "Focus on precision in each movement.",
            "Repeat for 3 sets with a 20‑second rest."
          ]
        },
        {
          order: 3,
          title: "Alternating Dribble Challenge",
          instructions: [
            "Alternate dribbling between hands continuously for 30 seconds.",
            "Focus on maintaining a consistent pace and form.",
            "Ensure each crossover is deliberate and controlled.",
            "Perform 3 sets with a 15‑second rest."
          ]
        }
      ]
    },
    // ... Sessions 5–14 would continue with progressive modifications as described in the blueprint.
    // (For brevity, assume similar detailed session objects are provided for sessions 5 to 14.)
  ]
};

const beginnerHandlesWeekly = {
  title: "Handles Course - Beginner (Weekly Training)",
  description: "Enhance ball handling endurance with extended sessions over 2 months (8 sessions) on a weekly schedule.",
  level: "beginner",
  duration: "2 months",
  frequency: "weekly",
  sessions: [
    {
      sessionNumber: 1,
      sessionTitle: "Extended Fundamentals",
      drills: [
        {
          order: 1,
          title: "Extended Stationary Dribble",
          instructions: [
            "Alternate right and left hand dribbles continuously for 3 minutes.",
            "Focus on maintaining perfect form and control.",
            "Perform the drill steadily with full concentration.",
            "Repeat for 3 sets with a short rest period."
          ]
        },
        {
          order: 2,
          title: "Extended Figure‑8 Drill",
          instructions: [
            "Complete 15 cycles of a figure‑8 dribble with smooth arm extension.",
            "Ensure full range of motion in each cycle.",
            "Maintain a consistent rhythm throughout the drill.",
            "Perform 2 sets with a 30‑second rest between sets."
          ]
        },
        {
          order: 3,
          title: "Extended Cone Weave",
          instructions: [
            "Weave through 5 cones for 3 rounds continuously.",
            "Focus on quick lateral movements and sharp direction changes.",
            "Maintain steady dribbling with full control.",
            "Repeat the circuit with a short recovery period."
          ]
        },
        {
          order: 4,
          title: "Form Focus Cool‑Down",
          instructions: [
            "Slow down and perform controlled dribbling for 2 minutes.",
            "Focus exclusively on perfecting your technique.",
            "Maintain a relaxed yet focused posture throughout.",
            "Use this period to recover and refine your form."
          ]
        }
      ]
    },
    // Sessions 2–8 would follow a similar extended circuit pattern with progressive difficulty.
    {
      sessionNumber: 2,
      sessionTitle: "Integrated Dribble & Movement",
      drills: [
        {
          order: 1,
          title: "Dynamic Dribble",
          instructions: [
            "Dribble while walking forward for 10 steps, then perform 20 seconds of stationary dribbling.",
            "Focus on smooth transitions between movement and stationary phases.",
            "Maintain consistent control during the forward motion.",
            "Repeat for 3 sets with brief rests."
          ]
        },
        {
          order: 2,
          title: "Zigzag Course",
          instructions: [
            "Complete 4 rounds through a 20‑ft zigzag course.",
            "Focus on rapid direction changes with full control.",
            "Maintain a consistent pace throughout the drill.",
            "Perform 3 rounds with proper recovery between rounds."
          ]
        },
        {
          order: 3,
          title: "Advanced Crossover Sequence",
          instructions: [
            "Perform 12 crossovers per side with quick, deliberate movements.",
            "Focus on executing each crossover with precision.",
            "Maintain a high intensity throughout the drill.",
            "Repeat for 3 sets with short rest intervals."
          ]
        },
        {
          order: 4,
          title: "Reaction Dribble",
          instructions: [
            "Dribble continuously for 2 minutes while reacting to partner cues.",
            "Focus on rapid adjustments to simulated defensive calls.",
            "Maintain full control despite sudden changes in direction.",
            "Perform 3 rounds with appropriate recovery."
          ]
        },
        {
          order: 5,
          title: "Cool‑Down Dribbling",
          instructions: [
            "Finish the session with 3 minutes of slow, controlled dribbling.",
            "Focus on technique and proper form.",
            "Use this time to gradually lower your intensity.",
            "Repeat for 3 sets with full recovery."
          ]
        }
      ]
    }
    // ... Sessions 3–8 would be added following the blueprint’s extended circuit pattern.
  ]
};

/**
 * Similarly, complete objects for Beginner Finishing and Beginner Shooting courses
 * (for Daily, Every‑Other‑Day, and Weekly training) are built following the blueprint.
 * For brevity, here we provide one example for Beginner Finishing Daily Training:
 */
const beginnerFinishingDaily = {
  title: "Finishing Course - Beginner (Daily Training)",
  description: "Master basic layup and finishing techniques with daily sessions over 2 weeks (14 sessions).",
  level: "beginner",
  duration: "2 week",
  frequency: "daily",
  sessions: [
    {
      sessionNumber: 1,
      sessionTitle: "Basic Layup Fundamentals",
      drills: [
        {
          order: 1,
          title: "Basic Layup Drill (Right Side)",
          instructions: [
            "Stand 5 feet from the basket on your right side.",
            "Dribble forward and take 2 controlled steps.",
            "Finish with a right‑hand layup off the backboard.",
            "Perform 10 reps and complete 3 sets with a 20‑second rest."
          ]
        },
        {
          order: 2,
          title: "Basic Layup Drill (Left Side)",
          instructions: [
            "Mirror the right‑side drill on the left side.",
            "Dribble forward and take 2 controlled steps.",
            "Finish with a left‑hand layup off the backboard.",
            "Perform 10 reps and complete 3 sets with a 20‑second rest."
          ]
        },
        {
          order: 3,
          title: "Mikan Drill",
          instructions: [
            "Stand directly under the basket.",
            "Perform a layup using your right hand aiming at the backboard’s square.",
            "Catch the rebound and immediately switch to your left hand.",
            "Alternate for 12 reps per hand and complete 3 sets."
          ]
        }
      ]
    },
    // Sessions 2–7 for Cycle 1 and Sessions 8–14 for Progression would follow with similar detailed drills.
  ]
};

const beginnerShootingDaily = {
  title: "Shooting Course - Beginner (Daily Training)",
  description: "Develop proper shooting form, quick release, and jump shot consistency with daily practice over 2 weeks (14 sessions).",
  level: "beginner",
  duration: "2 week",
  frequency: "daily",
  sessions: [
    {
      sessionNumber: 1,
      sessionTitle: "Form Shooting Fundamentals",
      drills: [
        {
          order: 1,
          title: "Close‑Range Form Shooting",
          instructions: [
            "Stand 3 feet from the basket with a balanced stance.",
            "Focus on your shooting form and follow‑through on each shot.",
            "Shoot 15 times with full concentration on technique.",
            "Complete 3 sets with 20‑second rests between sets."
          ]
        },
        {
          order: 2,
          title: "Spot Shooting Drill",
          instructions: [
            "Mark three spots on the court: left elbow, top of key, and right elbow.",
            "From each spot, shoot 10 jump shots focusing on consistency.",
            "Maintain proper form and rhythm for each shot.",
            "Perform 3 rounds covering all spots."
          ]
        },
        {
          order: 3,
          title: "Free Throw Routine",
          instructions: [
            "Position yourself at the free‑throw line with your pre‑shot routine.",
            "Focus on balance and consistent release.",
            "Shoot 10 free throws with steady form.",
            "Complete 3 sets with a 30‑second rest between sets."
          ]
        }
      ]
    }
    // Sessions 2–14 would be added similarly following the blueprint.
  ]
};

/**
 * For Intermediate and Professional courses we use the helper function generateSessions.
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
  // (Assume similar complete objects for Beginner Finishing Every‑Other‑Day and Weekly training)
  // For brevity, you can similarly construct beginnerShootingDaily, beginnerShootingEveryOtherDay, beginnerShootingWeekly.
  beginnerShootingDaily,
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
          // Since each drill’s instructions have been reworded to contain exactly 4 steps,
          // no extra default steps are added.
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
