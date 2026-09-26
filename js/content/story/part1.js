// story/part1.js — the dialogue of the Academy and Part I (docs/STORY_PLAN.md). Pure data.
// A scene is a list of lines: { who, text, side? } for a character (who = a roster, enemy or
// npc id; side 'left' for the player's side, 'right' for the enemy's, chosen by default from the
// speaker) or { caption } for the narrator's one line of time and place. Every line stays under
// 90 characters; names and events follow the anime (English dub), the manga for gaps, and the
// rules of STORY_PLAN.md §2 (voices, spoilers). Keys: arc id → { opener, closer, nodes: { id:
// { intro, boss?, outro? } } }.
const N = (caption) => ({ caption });
const L = (who, text, side = null) => (side ? { who, text, side } : { who, text });

export const PART1_STORY = {
  arc_tutorial: {
    opener: [
      N('The Hidden Leaf Village. Graduation night.'),
      L('iruka', 'Naruto! The Scroll of Sealing? Do you know what you\'ve done?'),
      L('naruto', 'Mizuki-sensei said if I learn a jutsu from it, you\'d pass me! I learned one!'),
      L('iruka', 'Mizuki said that… Naruto, get behind me. Now.'),
      L('e_mizuki', 'Give me the scroll, Naruto. Iruka has been lying to you your whole life.'),
    ],
    closer: [
      L('iruka', 'Close your eyes a second. There. Congratulations, graduate.'),
      L('naruto', 'Iruka-sensei… this is your headband!'),
      L('iruka', 'The Survival Test is tomorrow. Get some sleep. You won\'t.'),
      N('Team 7 is assigned the next morning: Naruto, Sasuke, Sakura. And a very late jonin.'),
    ],
    nodes: {
      n_tut_1: {
        intro: [
          L('iruka', 'A squad is three ninja and a leader. Pick who fights up front and who hangs back.'),
          L('iruka', 'Tanks and Strikers close in. Ranged and Support stay back. The Leader lifts everyone.'),
          L('naruto', 'Got it. So I go first, and everyone else follows me. Believe it!'),
        ],
        outro: [
          L('e_mizuki', 'Lucky. Just lucky.'),
          L('iruka', 'That wasn\'t luck. That was a team.'),
        ],
      },
      n_tut_2: {
        intro: [
          L('kakashi', 'Yo. Kakashi Hatake. Consider this an early look at your new sensei.'),
          L('kakashi', 'Mizuki\'s using Earth Style. Look at the wheel: Earth loses to Wind, and Wind is Naruto.'),
          L('sakura', 'So the ninja whose nature beats the enemy\'s does extra damage. And the enemy\'s does less.'),
        ],
      },
      n_tut_3: {
        intro: [
          L('kakashi', 'Chakra fills as you fight. When a portrait glows, that ninja\'s Ultimate is ready.'),
          L('kakashi', 'Mizuki is winding up a jutsu. Don\'t dodge it. Fire an Ultimate into it and clash.'),
          L('naruto', 'Head-on? That\'s the only way I know how to do anything!'),
        ],
        boss: [
          L('e_mizuki', 'One jutsu from a scroll, and you think you\'re a ninja?'),
          L('naruto', 'Multi Shadow Clone Jutsu! Count them, Mizuki. Then count again.'),
        ],
        outro: [
          L('e_mizuki', 'A thousand of him… I\'m looking at a thousand of him.'),
          L('naruto', 'Iruka-sensei, did you see? Did you see that?'),
        ],
      },
    },
    teach: {
      auto: [
        L('shikamaru', 'What a drag. Tapping every portrait yourself? Turn on Auto-ult and let it fire for you.'),
        L('shikamaru', 'It only clashes when your nature wins, and it holds anyone who\'d be Overwhelmed.'),
        L('shikamaru', 'Tap it again to take over. Me, I\'d rather lie in the grass.'),
      ],
    },
  },

  arc_belltest: {
    opener: [
      N('Training Ground 3. The morning of the Survival Test.'),
      L('kakashi', 'Two bells. Three of you. Anyone without one by noon goes back to the Academy.'),
      L('naruto', 'Back to the Academy?! No way. I\'m taking both of them, believe it!'),
      L('kakashi', 'Then come at me like you mean it. And Naruto… try not to get sent flying.'),
      L('sakura', 'He\'s… reading. Is he really going to fight us while he reads?'),
    ],
    closer: [
      L('kakashi', 'Those who break the rules are scum. Those who abandon their friends are worse than scum.'),
      L('kakashi', 'You pass. All three of you. Team 7 starts tomorrow.'),
      L('naruto', 'We PASS? I knew it. I knew it the whole time!'),
      N('Mission after mission. D-rank, every one.'),
    ],
    nodes: {
      n_bell_1: {
        intro: [
          L('sakura', 'Sasuke, we should hide and wait for an opening. He\'s a jonin.'),
          L('sasuke', 'Hide if you want. I\'m not going back to the Academy.'),
          L('naruto', 'Hey! Kakashi-sensei! You and me, right here, right now!'),
        ],
      },
      n_bell_2: {
        intro: [
          L('naruto', 'Here I come, Kakashi-sensei! One bell for me, one for me too!'),
          L('kakashi', 'Lesson one of ninja combat: taijutsu. Go ahead. I\'ll just be on this page.'),
          L('naruto', 'Are you READING? In the middle of a fight?!'),
        ],
        outro: [
          L('kakashi', 'Don\'t let an enemy get behind you. Hidden Leaf Secret Finger Jutsu…'),
          L('naruto', '…THAT WASN\'T A JUTSU.'),
        ],
      },
      n_bell_3: {
        intro: [
          L('sakura', 'Sasuke? Sasuke, your head\'s… where\'s the rest of you?!'),
          L('sasuke', 'Headhunter Jutsu. He\'s toying with us. All of us.'),
          L('naruto', 'Untie me! I can take him! Somebody untie me!'),
        ],
        boss: [
          L('e_kakashi_bell_boss', 'Lesson two: genjutsu. Lesson three: ninjutsu. Let\'s see which one you fail.'),
          L('sasuke', 'Fire Style: Fireball Jutsu. Try reading through that.'),
          L('e_kakashi_bell_boss', 'Ah. So there\'s one of you worth watching.'),
        ],
        outro: [
          L('kakashi', 'You worked together in the end. That was the test.'),
          L('naruto', 'Wait, that was it? The bells were a trick?'),
        ],
      },
    },
  },

  arc_waves: {
    opener: [
      N('The Land of Waves. A C-rank escort that isn\'t.'),
      L('npc_tazuna', 'This is my guard? A kid in orange? I asked for real ninja.'),
      L('naruto', 'I\'ll show you a real ninja, old man! I\'m the future Hokage!'),
      L('kakashi', 'A bridge builder with a bottle and a bodyguard budget. Stay close, all of you.'),
      L('sakura', 'Kakashi-sensei… why does a bridge need ninja?'),
    ],
    closer: [
      N('The bridge is finished. Two graves stand in the snow above the bay.'),
      L('npc_tazuna', 'We need a name for it. The Great Naruto Bridge. What do you think?'),
      L('naruto', 'The… the Great Naruto Bridge. Yeah. Yeah, that\'s a good bridge.'),
      L('kakashi', 'Zabuza and Haku. Remember them. Ninja aren\'t tools. Not the ones worth remembering.'),
    ],
    nodes: {
      n_waves_1: {
        intro: [
          L('e_gozu', 'The Copy Ninja. Take him first, then the old man.', 'right'),
          L('e_meizu', 'The old man is the job. Let the kids watch.', 'right'),
          L('kakashi', 'Naruto, Sasuke. Tazuna does not get scratched. That\'s the mission.'),
        ],
      },
      n_waves_2: {
        intro: [
          L('e_zabuza_1', 'Kakashi of the Sharingan. Hand over the old man and the children live.', 'right'),
          L('kakashi', 'Zabuza Momochi. Get back, all of you. This one\'s different.'),
          L('naruto', 'Sensei\'s in the water thing! Sasuke, I have a plan. It\'s a stupid plan.'),
        ],
        outro: [
          L('e_zabuza_1', 'A shadow clone as a shuriken. Clever brat.'),
          L('kakashi', 'They\'re not brats. They\'re my students.'),
        ],
      },
      n_waves_3: {
        intro: [
          L('npc_tsunami', 'Inari, get inside! Don\'t come out, whatever you hear!'),
          L('e_zori', 'Gato wants the woman. The boy too, if he\'s loud.', 'right'),
          L('naruto', 'You touch her and I\'ll show you what a real hero does!'),
        ],
      },
      n_waves_4: {
        intro: [
          L('e_haku', 'Crystal Ice Mirrors. You will not leave them. Do you have someone precious to you?', 'right'),
          L('sasuke', 'Naruto. Stop charging the mirrors. Watch where he moves.'),
          L('naruto', 'I don\'t watch! I HIT things!'),
        ],
        outro: [
          L('naruto', 'Sasuke… why? Why did you stand there?'),
          L('sasuke', 'My body moved on its own. Don\'t… don\'t die too, idiot.'),
        ],
      },
      n_waves_5: {
        intro: [
          N('The bridge. The mist rolls in from the sea.'),
          L('kakashi', 'He\'ll come for me first. The rest of you, keep Tazuna behind you.'),
          L('sakura', 'And if the mist takes you too, Sensei?'),
        ],
        boss: [
          L('e_zabuza_boss', 'Sharingan Kakashi. I\'ve heard the stories. Let\'s see if any of them are true.'),
          L('kakashi', 'You\'ll see the one about the Lightning Blade. Once.'),
          L('e_zabuza_boss', 'Water Style: Water Dragon Jutsu. Drown with your stories.'),
        ],
        outro: [
          N('Gato\'s thugs scatter. Zabuza kneels beside Haku as the snow begins.'),
          L('e_zabuza_boss', 'Kid… you talked too much. He never did. Put me next to him.'),
        ],
      },
    },
  },

  arc_chunin: {
    opener: [
      N('The Chunin Exams. Genin from every village fill the hall.'),
      L('kakashi', 'I nominated all three of you. Don\'t make me regret the paperwork.'),
      L('kiba', 'Naruto? They let Naruto in? This exam just got easy.'),
      L('shikamaru', 'What a drag. Everyone\'s looking at everyone. Just take the test.'),
      L('naruto', 'Listen up! Naruto Uzumaki is here and I\'m beating all of you!'),
    ],
    closer: [
      N('The finals stop mid-match. Feathers drift down over the arena.'),
      L('sakura', 'Everyone\'s asleep… it\'s a genjutsu. Sasuke, wake up!'),
      L('kakashi', 'Sand and Sound. So that\'s what the exam was for. Sakura, find Naruto.'),
      L('gaara', 'Uzumaki. I will kill you and feel alive. Come to the forest.', 'right'),
    ],
    nodes: {
      n_chunin_1: {
        intro: [
          N('The Forest of Death. Day two.'),
          L('e_orochimaru_forest', 'You three are so much more entertaining than I hoped.', 'right'),
          L('sasuke', 'Sakura. Take Naruto and run. Don\'t look back.'),
          L('sakura', 'Sasuke, your hands are shaking…'),
        ],
        outro: [
          L('e_orochimaru_forest', 'A gift, Sasuke. You\'ll come to me for more.'),
          L('naruto', 'Sasuke? Sasuke, say something!'),
        ],
      },
      n_chunin_2: {
        intro: [
          L('e_dosu', 'Wake Sasuke Uchiha. We were told to kill him ourselves.', 'right'),
          L('sakura', 'You\'re not touching either of them. Not while I\'m standing.'),
          L('lee', 'Sakura! Rock Lee will protect you until his last breath! Leaf Hurricane!'),
        ],
      },
      n_chunin_3: {
        intro: [
          L('e_oboro', 'Misty Follower Jutsu. Hit us all you like. We are everywhere.', 'right'),
          L('naruto', 'A hundred of you? Fine. Shadow Clone Jutsu! A hundred of me!'),
          L('sasuke', 'The real ones don\'t flinch when the clones hit. Watch for that.'),
        ],
      },
      n_chunin_4: {
        intro: [
          L('e_yoroi', 'One touch and your chakra is mine, Uchiha. Try landing a punch.', 'right'),
          L('e_misumi', 'And I bend where bones don\'t. Hold still.', 'right'),
          L('kabuto', 'My teammates. Hm. I wouldn\'t take either of them lightly.'),
        ],
      },
      n_chunin_5: {
        intro: [
          N('The finals arena. The whole village is watching.'),
          L('neji', 'You were born a failure. Fate decided this match before you walked in.', 'right'),
          L('naruto', 'Then I\'ll beat fate too! Nobody tells me what I was born as!'),
        ],
        boss: [
          L('e_neji_boss', 'Eight Trigrams Sixty-Four Palms. This is the Hyuga. This is fate.'),
          L('naruto', 'You keep saying that word. Say it again when I\'m standing over you.'),
          L('e_neji_boss', 'Rotation. Come, then.'),
        ],
        outro: [
          L('naruto', 'When I\'m Hokage, I\'ll change the Hyuga. Every branch of it. That\'s a promise.'),
          L('neji', '…A failure who beat a genius. Maybe fate isn\'t finished writing after all.'),
        ],
      },
    },
  },

  arc_konoha_crush: {
    opener: [
      N('Zero hour. Sand and Sound pour over the walls of the Hidden Leaf.'),
      L('kakashi', 'The village is under attack. Genin: wake the sleepers and get them clear.'),
      L('guy', 'Kakashi! Our youth will be the wall they break against!'),
      L('sakura', 'Naruto\'s gone after Sasuke. Sasuke\'s gone after Gaara. I\'m going after both.'),
    ],
    closer: [
      N('The Third Hokage\'s funeral. Rain over the Hidden Leaf.'),
      L('konohamaru', 'Grandpa… I was going to beat you one day. I was going to take the hat.'),
      L('iruka', 'He knew, Konohamaru. He counted on it.'),
      L('naruto', 'He believed in all of us. So we don\'t get to stop now.'),
    ],
    nodes: {
      n_crush_1: {
        intro: [
          L('shikamaru', 'Fighting on my day off. What a drag. Choji, the left. Ino, mind the kids.'),
          L('ino', 'Mind the kids yourself, Shikamaru! I\'m taking the wall!'),
          L('choji', 'Nobody eats until this is over. Okay. That\'s motivation.'),
        ],
      },
      n_crush_2: {
        intro: [
          L('e_kankuro', 'Gaara needs time. You\'re not getting past Crow, bug boy.', 'right'),
          L('shino', 'My insects have already found your puppet\'s strings. They are hungry.'),
          L('e_temari', 'Kankuro, hurry it up. I won\'t carry you.', 'right'),
        ],
      },
      n_crush_3: {
        intro: [
          N('The barrier on the roof. The Third Hokage faces his student.'),
          L('e_orochimaru_crush', 'Sensei. Do you like my summons? You taught me to honour the dead.', 'right'),
          L('hiruzen', 'Orochimaru. I should have stopped you years ago. I\'ll finish it today.'),
        ],
        boss: [
          L('e_orochimaru_crush', 'The First and Second Hokage. Your teachers, old man. Kneel to them.'),
          L('hiruzen', 'They taught me the Will of Fire. You only ever learned the fire.'),
          L('e_orochimaru_crush', 'Then burn with the village you love so much.'),
        ],
        outro: [
          L('hiruzen', 'Sealing Jutsu: Reaper Death Seal. Your arms, Orochimaru. Not your life. My apologies.'),
          L('hiruzen', 'I still believe in the next generation. Naruto… all of you. Carry it.'),
        ],
      },
      n_crush_4: {
        intro: [
          L('gaara', 'I exist to kill everyone but myself. That is how I know I am alive.', 'right'),
          L('naruto', 'You\'re alone. I know that look. I had that look.'),
          L('sakura', 'Naruto, his sand… it\'s all around us. Please be careful.'),
        ],
        boss: [
          L('e_gaara_boss', 'Uzumaki. Feed me. Sand Coffin. Sand Burial.'),
          L('naruto', 'You think you\'re the only one who was alone? I\'ll shut you up with one finger!'),
          L('e_gaara_boss', 'Play Possum. Now you will see all of me.'),
        ],
        outro: [
          L('gaara', 'Why… why would you fight this hard for someone else?'),
          L('naruto', 'Because they saved me from being you. Temari, Kankuro… take him home.'),
        ],
      },
    },
  },

  arc_tsunade: {
    opener: [
      N('Two men in black cloaks at the gate. Red clouds on the cloth.'),
      L('kisame', 'Itachi. The Nine-Tails boy is here. Shall we take a look?', 'right'),
      L('itachi', 'Kisame. Quietly.', 'right'),
      L('jiraiya', 'Kid, pack a bag. We\'re going to find the one person who can heal the village.'),
      L('naruto', 'A person who heals a village? Where do we even start?'),
    ],
    closer: [
      N('The Fifth Hokage takes the hat.'),
      L('tsunade', 'Fine. I\'ll take the job. Somebody has to keep this brat alive.'),
      L('naruto', 'I told you! I said I\'d be Hokage and you said the necklace was a bet!'),
      L('shizune', 'Lady Tsunade… you\'re smiling. You never smile.'),
    ],
    nodes: {
      n_tsunade_1: {
        intro: [
          L('e_itachi', 'Kakashi. We only want to talk to the boy.', 'right'),
          L('kurenai', 'Then talk to us first. Asuma, his eyes. Don\'t look at his eyes.'),
          L('asuma', 'Buy time. Guy\'s on his way, and he never walks in quietly.'),
        ],
        outro: [
          L('guy', 'DYNAMIC ENTRY! The Leaf\'s noble green beast has arrived!'),
          L('kakashi', 'Guy. For once… good timing.'),
        ],
      },
      n_tsunade_2: {
        intro: [
          L('tsunade', 'One week to learn the Rasengan, brat. You lose, and you give me your dream.', 'right'),
          L('naruto', 'One week? Watch me do it in three days!'),
          L('tsunade', 'And I only need one finger. Don\'t cry when you lose.', 'right'),
        ],
      },
      n_tsunade_3: {
        intro: [
          L('kabuto', 'Lady Tsunade. Lord Orochimaru just wants his arms back. Heal him.', 'right'),
          L('shizune', 'She won\'t. And you won\'t lay a hand on her, Kabuto.'),
          L('kabuto', 'A medical ninja against a medical ninja. Let\'s see whose scalpel is sharper.', 'right'),
        ],
      },
      n_tsunade_4: {
        intro: [
          N('Tanzaku Town. Three Sannin on one field for the first time in years.'),
          L('jiraiya', 'Orochimaru. You should have stayed a snake in the grass.'),
          L('tsunade', 'Blood. There\'s blood on my hands… I can\'t… I can\'t move.'),
        ],
        boss: [
          L('e_orochimaru_boss', 'Summoning Jutsu. Manda, do be gentle with my old teammates.'),
          L('jiraiya', 'Gamabunta! Sorry about the timing!'),
          L('e_orochimaru_boss', 'Tsunade, still shaking? Stand aside and let me have the boy.'),
        ],
        outro: [
          L('tsunade', 'This necklace is yours now, Naruto. Don\'t you dare die with it on.'),
          L('tsunade', 'And you\'ll be Hokage. I bet on it, and I never lose.'),
        ],
      },
    },
  },

  arc_tea: {
    opener: [
      N('Side mission. The Land of Tea, race day.'),
      L('npc_idate', 'The Hidden Leaf sent kids? I run faster than all of you asleep.'),
      L('naruto', 'Say that again, runner boy! I\'ll carry you across the finish line!'),
      L('sakura', 'Kakashi-sensei couldn\'t come, so it\'s just us. Play nice, Naruto.'),
      L('sasuke', 'Watch the water. Nobody hires ninja to protect a footrace.'),
    ],
    closer: [
      L('npc_idate', 'Hey. Naruto. Next time… next time, I\'ll run it without you.'),
      L('naruto', 'Next time you won\'t need me. That\'s the point, right?'),
      L('sasuke', 'He beat me. Naruto. In front of everyone.'),
      N('The main road home. Sasuke does not sleep that night.'),
    ],
    nodes: {
      n_tea_1: {
        intro: [
          L('e_oboro', 'The Wagarashi family pays well. The runner does not reach the shore.', 'right'),
          L('e_mubi', 'Underground Move. He won\'t see me until I\'m under him.', 'right'),
          L('naruto', 'Idate, stay by me! I can\'t protect you if you keep running!'),
        ],
      },
      n_tea_2: {
        intro: [
          L('e_aoi', 'An umbrella. Do you know what happens when I open it?', 'right'),
          L('sasuke', 'Senbon. Poisoned. Sakura, behind the rocks. Now.'),
          L('e_aoi', 'Ninja Art: Senbon Rainstorm. Stay dry if you can.', 'right'),
        ],
      },
      n_tea_3: {
        intro: [
          L('npc_idate', 'That sword… he stole it. Aoi was a Leaf ninja. He was my brother\'s teacher.'),
          L('naruto', 'The Second Hokage\'s sword? Then he\'s got no right to swing it.'),
          L('sasuke', 'Lightning turns his blade. Fire Style won\'t be enough. Naruto, hold him.'),
        ],
        boss: [
          L('e_aoi_boss', 'The Blade of the Thunder Spirit. A Hokage\'s sword, in a traitor\'s hand. Poetic.'),
          L('sasuke', 'You\'re not worth the sword. You\'re not even worth the rain.'),
          L('e_aoi_boss', 'Then let the blade decide.'),
        ],
        outro: [
          L('npc_idate', 'I crossed the line. I actually crossed it. Did you see?'),
          L('sasuke', 'Naruto did that. Not me. I was on the ground.'),
        ],
      },
    },
  },

  arc_sasuke_recovery: {
    opener: [
      N('The Sound Ninja Four came for Sasuke. He went.'),
      L('shikamaru', 'My first mission as a chunin, and it\'s this. Naruto, Choji, Neji, Kiba. Let\'s go.'),
      L('naruto', 'We bring Sasuke back. That\'s the mission. That\'s the only mission.'),
      L('sakura', 'Naruto… please. Bring him home. I couldn\'t stop him. Please.'),
      L('naruto', 'I promise you, Sakura. I\'ll bring him back. That\'s a promise of a lifetime.'),
    ],
    closer: [
      N('Jiraiya at the gate. A pack, a scroll, and two and a half years.'),
      L('jiraiya', 'You want to bring him back? Then get strong enough that he can\'t say no.'),
      L('naruto', 'Two and a half years. Then I\'m coming home, and then I\'m going to get him.'),
      L('kakashi', 'The Leaf will be waiting. So will Sakura. Go on.'),
    ],
    nodes: {
      n_sr_1: {
        intro: [
          L('e_jirobo', 'Fat boy stays. The rest of you can run along. I\'ll eat your chakra either way.', 'right'),
          L('choji', 'Go. All of you. I\'ve got the pills, and I\'ve got him.'),
          L('shikamaru', 'Choji… don\'t you dare eat the last one. That\'s an order.'),
        ],
      },
      n_sr_2: {
        intro: [
          L('e_kidomaru', 'Six arms, one bow. I\'ll take your eyes first, Hyuga.', 'right'),
          L('neji', 'Then you should have aimed for the one thing I can\'t see. You missed.'),
          L('neji', 'Everyone. Move on. This one is mine.'),
        ],
      },
      n_sr_3: {
        intro: [
          L('e_sakon', 'Two of us in one body, dog boy. Which one do you want to hit?', 'right'),
          L('kiba', 'Both. Akamaru, we\'re doing this the loud way.'),
          L('temari', 'The Sand owes the Leaf a debt. Consider this the first payment.'),
        ],
      },
      n_sr_4: {
        intro: [
          L('e_kimimaro', 'Lord Orochimaru\'s vessel goes forward. Everything else stops here.', 'right'),
          L('lee', 'Rock Lee is everything else. And Rock Lee does not stop!'),
          L('gaara', 'Lee. Behind my sand. This one\'s bones are not for you.'),
        ],
        boss: [
          L('e_kimimaro', 'I am the last of the Kaguya. My body is my blade. Bracken Dance.'),
          L('gaara', 'Then I will bury the last of the Kaguya with everything I have.'),
          L('e_kimimaro', 'Lord Orochimaru… I am coming.'),
        ],
        outro: [
          L('lee', 'He… he stopped. He just stopped, an inch from my face.'),
          L('gaara', 'His body gave out before his loyalty did. Remember that. Not the rest.'),
        ],
      },
      n_sr_5: {
        intro: [
          N('The Final Valley. Two statues. Two boys.'),
          L('naruto', 'Sasuke! Why? Why him? What does Orochimaru have that we don\'t?'),
          L('sasuke', 'Power. And you will never understand what it\'s for.'),
        ],
        boss: [
          L('e_sasuke_boss', 'Why do you keep chasing me, Naruto?'),
          L('naruto', 'Because you\'re my friend. That\'s the only reason I\'ve ever needed.'),
          L('e_sasuke_boss', 'Then I\'ll cut that bond here.'),
          L('naruto', 'Then I\'ll break every bone in your body to drag you home!'),
        ],
        outro: [
          N('Rain on the valley. Two headbands. One scratched.'),
          L('kakashi', 'You did everything you could.'),
          L('naruto', 'I made Sakura a promise. I\'m not done, believe it.'),
        ],
      },
    },
  },

  arc_kurosuki: {
    opener: [
      N('Side mission. The Katabami Gold Mine.'),
      L('guy', 'Team Guy! And Naruto! A village in chains calls to our youth!'),
      L('naruto', 'Why are they having a funeral in the middle of the day? With… music?'),
      L('tenten', 'Because the Kurosuki family buries people who complain. Alive.'),
      L('neji', 'Then someone is about to complain. Loudly. Naruto, stop grinning.'),
    ],
    closer: [
      L('guy', 'YOUTH! Curry, a storm, and a family removed! What a mission!'),
      L('lee', 'Guy-sensei, I ate the whole pot of the curry of life. I cannot feel my face.'),
      L('naruto', 'Raiga wanted eyes that could see him. I think… I think he had them.'),
      N('The road home. Ranmaru sleeps in the curry shop\'s back room.'),
    ],
    nodes: {
      n_kuro_1: {
        intro: [
          L('npc_rokusuke', 'They\'re burying me! I\'m alive and they\'re burying me! Somebody!'),
          L('e_kurosuki', 'Funerals are cheaper when the guest of honour helps dig.', 'right'),
          L('naruto', 'Hang on, old man! Shadow Clone Jutsu! Shovels, everyone!'),
        ],
      },
      n_kuro_2: {
        intro: [
          L('e_raiga', 'Ranmaru. Tell me where they are. Tell me where to strike.', 'right'),
          L('e_ranmaru', 'Two to your left, Raiga. The loud one is coming straight at you.', 'right'),
          L('neji', 'He can\'t see us. The boy on his back sees for him. Blind the eyes first.'),
        ],
      },
      n_kuro_3: {
        intro: [
          N('Lightning over the mine. Raiga stands in the storm.'),
          L('lee', 'He has come back for a funeral. His own, or ours?'),
          L('naruto', 'Neither! Nobody\'s having a funeral today! I\'m sick of funerals!'),
        ],
        boss: [
          L('e_raiga_boss', 'Thunder Funeral: Feast of Lightning. Sing, little ninja. Sing for me.'),
          L('naruto', 'The only thing singing is your teeth when I knock them out!'),
          L('e_raiga_boss', 'Ranmaru… where are you? Ranmaru!'),
        ],
        outro: [
          L('naruto', 'He walked into the storm himself. He didn\'t want to be caught.'),
          L('guy', 'Then we honour him the Leaf way, Naruto. With curry. And with youth.'),
        ],
      },
    },
  },
};
