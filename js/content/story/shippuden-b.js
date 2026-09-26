// story/shippuden-b.js — the dialogue of Shippuden arcs 17–25 (docs/STORY_PLAN.md). Pure data,
// same shape as story/part1.js. Spoiler discipline: Nagato is named once he is met, Obito's
// identity is said only from the Climax arc, Kaguya only in her own, nothing about the ending.
const N = (caption) => ({ caption });
const L = (who, text, side = null) => (side ? { who, text, side } : { who, text });

export const SHIPPUDEN_B_STORY = {
  arc_sixtails: {
    opener: [
      N('Side mission. The Tsuchigumo village.'),
      L('npc_hotaru', 'Master Utakata! Wait for me! I\'m your student, you can\'t just leave!'),
      L('naruto', 'A wandering guy with bubbles and a girl who won\'t stop following him. Sounds familiar.'),
      L('sakura', 'It sounds like you and Jiraiya. Be nice to her.'),
      L('yamato', 'Our mission is the girl. The Tsuchigumo clan has a jutsu people kill for.'),
    ],
    closer: [
      L('npc_hotaru', 'Master! You came back! I knew you would!'),
      L('naruto', 'Master and student, huh. He acts like he hates it. He doesn\'t.'),
      L('sakura', 'Neither did Jiraiya, Naruto.'),
      N('The main plot resumes: the Hidden Leaf, and a day that changes it.'),
    ],
    nodes: {
      n_sixtails_1: {
        intro: [
          L('e_tracker_ninja', 'Utakata of the Hidden Mist. Come quietly, and the girl lives.', 'right'),
          L('npc_hotaru', 'Let me go! Master, don\'t listen to them!'),
          L('naruto', 'Trackers from the Mist? Hands off her! Shadow Clone Jutsu!'),
        ],
      },
      n_sixtails_2: {
        intro: [
          L('e_bandit_ninja', 'The whole village is with us now. Nobody leaves the valley.', 'right'),
          L('sakura', 'They\'re villagers. Turned. We hold, we don\'t hurt them more than we must.'),
          L('naruto', 'Holding again?! Fine! Yamato, count the seconds out loud!'),
        ],
      },
      n_sixtails_3: {
        intro: [
          L('e_shiranami_boss', 'The forbidden jutsu is mine. The girl is its battery. Step aside, Leaf.', 'right'),
          L('npc_hotaru', 'I can\'t move… his words… they\'re inside my head!'),
          L('naruto', 'Word Bind? Then I\'ll talk louder! HOTARU! WE\'VE GOT YOU!'),
        ],
        boss: [
          L('e_shiranami_boss', 'Tsuchigumo Style: Forbidden Jutsu Release. The village goes with her.'),
          L('naruto', 'You\'re not blowing up a village with a kid! Rasengan!'),
          L('e_shiranami_boss', 'Big Bang. Say goodbye.'),
        ],
        outro: [
          N('Bubbles drift over the valley. The jutsu never fires.'),
          L('npc_hotaru', 'Master… you used the bubbles. You saved everyone.'),
        ],
      },
    },
  },

  arc_pain: {
    opener: [
      N('The day Pain came to the Hidden Leaf.'),
      L('e_pain_deva', 'Where is the Nine-Tails jinchuriki? Answer, and the village lives a little longer.', 'right'),
      L('kakashi', 'Six of them. Gather everyone. And someone get word to Naruto.'),
      L('tsunade', 'Katsuyu. Every ninja in the village. Now.'),
      L('shizune', 'Lady Tsunade, the walls… the walls are already down.'),
    ],
    closer: [
      N('The village stands in the rubble. Every ninja on their feet.'),
      L('sakura', 'Naruto! You idiot! You absolute… come here. Come here.'),
      L('iruka', 'Look at them. Look at all of them. They\'re here for you, Naruto.'),
      L('kakashi', 'Hokage. He\'s not there yet. But today the village decided.'),
    ],
    nodes: {
      n_pain_1: {
        intro: [
          L('e_pain_animal', 'Summoning Jutsu. Let the animals search the streets.', 'right'),
          L('npc_leaf_villager', 'They\'re everywhere! Please, somebody, my children are inside!'),
          L('kakashi', 'Get the civilians behind the walls. Nothing touches them. Nothing.'),
        ],
      },
      n_pain_2: {
        intro: [
          L('e_pain_deva', 'Kakashi Hatake. The Copy Ninja. Where is the boy?', 'right'),
          L('kakashi', 'He\'s not here. And you\'ll never find out where.'),
          L('e_pain_asura', 'Then we take the Sharingan and ask the corpse.', 'right'),
        ],
        outro: [
          N('Kakashi sits in the rubble, thinking of a man with silver hair.'),
          L('kakashi', 'Father… I think I understand you now. Just a little.'),
        ],
      },
      n_pain_3: {
        intro: [
          L('e_pain_naraka', 'A child. Move, child. The King of Hell has no use for you.', 'right'),
          L('konohamaru', 'My name is Konohamaru! Surname Sarutobi! And you\'re in my village!'),
          L('konohamaru', 'Naruto taught me this. So it\'s going to work. Rasengan!'),
        ],
      },
      n_pain_4: {
        intro: [
          N('A crater where the village was. A boy in a red cloak lands in the middle.'),
          L('naruto', 'Sage Mode. Tsunade… I\'ll take it from here. Rest.'),
          L('e_pain_preta', 'The Nine-Tails jinchuriki. At last.', 'right'),
        ],
      },
      n_pain_5: {
        intro: [
          L('e_pain_deva', 'This world has known nothing but pain. I will teach it to end.', 'right'),
          L('naruto', 'I lost my master to you. But he believed in something. So do I.'),
          L('e_pain_deva', 'Belief. Your master had it too. It didn\'t save him.', 'right'),
        ],
        boss: [
          L('e_pain_boss', 'Almighty Push. Planetary Devastation. Do you feel it yet, Uzumaki?'),
          L('naruto', 'I feel it. I\'ve always felt it. That\'s why I\'m not going to become you!'),
          L('e_pain_boss', 'Then show me your answer.'),
        ],
        outro: [
          N('Hinata stood in front of him. Nagato heard the answer. Everyone came back.'),
          L('naruto', 'Nagato… you chose it. You chose them. I\'ll never forget that.'),
        ],
      },
    },
  },

  arc_summit: {
    opener: [
      N('The Land of Iron. Five Kage, one table.'),
      L('ay', 'The Akatsuki took my brother! And you sit here and TALK?'),
      L('gaara', 'I came to talk. Once, someone talked to me, and it changed everything.'),
      L('e_danzo_boss', 'The Hidden Leaf is here. I am its Hokage now.', 'right'),
      L('kakashi', 'Danzo. Wearing the hat. Sakura, whatever happens in there, stay with me.'),
    ],
    closer: [
      L('e_tobi', 'I am declaring the Fourth Great Ninja War. Give me the last two beasts.', 'right'),
      L('ay', 'Then it\'s war. The Cloud stands. Who stands with us?'),
      L('gaara', 'The Sand. And, I think, all of us.'),
      N('The Kage answer. The world takes sides.'),
    ],
    nodes: {
      n_summit_1: {
        intro: [
          L('e_sasuke_summit', 'The Raikage. Your samurai were slow. Are you?', 'right'),
          L('ay', 'You took my brother, Uchiha. I\'ll take you apart with my bare hands.'),
          L('e_jugo', 'Sasuke, he\'s fast… I\'ll take the hits. Go through me.', 'right'),
        ],
      },
      n_summit_2: {
        intro: [
          L('e_kisame_fused', 'Samehada and I are one now. And you, Eight-Tails, are dinner.', 'right'),
          L('killer_bee', 'A fish with a sword, tryin\' to eat the Bee? Fool, ya fool, that ain\'t me!'),
          L('killer_bee', 'Out-damage the drain. Enka style. Let\'s go.'),
        ],
      },
      n_summit_3: {
        intro: [
          N('A bridge in the snow. Danzo turns to face him.'),
          L('e_danzo_boss', 'Sasuke Uchiha. Your clan died for this village. Be grateful.', 'right'),
          L('karin', 'Sasuke, his arm… there are eyes in his arm. Sharingan. Dozens.'),
        ],
        boss: [
          L('e_danzo_boss', 'Izanagi. Every death you deal me is a dream. Wake me if you can.'),
          L('sasuke', 'I\'ll kill you until the dreams run out.'),
          L('e_danzo_boss', 'The Foundation does not fall to a child.'),
        ],
        outro: [
          L('karin', 'Sasuke… I sensed it. His last eye closed. He\'s done. You did it.'),
          L('sasuke', 'Karin. Get behind me. It isn\'t over. Someone\'s coming.'),
        ],
      },
      n_summit_4: {
        intro: [
          L('sakura', 'Sasuke. I\'ll come with you. I\'ll leave the village. Just… take me.'),
          L('e_sasuke_summit_boss', 'Then kill her. Prove it.', 'right'),
          L('kakashi', 'Sakura, get back. Sasuke, this ends with me.'),
        ],
        boss: [
          L('e_sasuke_summit_boss', 'Kakashi. You never had the eyes for this. Neither did they.'),
          L('kakashi', 'I had you as a student. That was enough. Once.'),
          L('e_sasuke_summit_boss', 'Susanoo. Look at what you failed to teach.'),
        ],
        outro: [
          L('naruto', 'Sasuke! …Next time. Next time we fight for real, and then we\'ll both understand.'),
          L('sasuke', 'Next time, Naruto. One of us dies.'),
        ],
      },
    },
  },

  arc_countdown: {
    opener: [
      N('An island that moves. A war that hasn\'t.'),
      L('killer_bee', 'Welcome to the turtle, Naruto! Say hi to the Bee! Wheee!'),
      L('naruto', 'A turtle. A whole island is a TURTLE. Nobody tells me anything!'),
      L('yamato', 'You\'re here to train with the Eight-Tails\' host. And to stay out of the war.'),
      L('naruto', 'Out of the war? Yamato, that\'s the one thing I can\'t do.'),
    ],
    closer: [
      N('The alliance marches. Day one.'),
      L('gaara', 'Fifty thousand ninja. Five villages. One army. This has never happened.'),
      L('kakashi', 'And two of the beasts hidden on a turtle. Let\'s keep it that way.'),
      L('naruto', 'They\'re out there fighting for me. I\'m not staying on a turtle.'),
    ],
    nodes: {
      n_countdown_1: {
        intro: [
          L('npc_motoi', 'Naruto! Behind you! The squid! It\'s got— it\'s got me!'),
          L('killer_bee', 'Motoi, my brother from way back, hang tight, the Bee\'s got your back!'),
          L('naruto', 'A giant squid. Sure. Why not. Let\'s go!'),
        ],
      },
      n_countdown_2: {
        intro: [
          N('Inside. The cage. The fox.'),
          L('e_nine_tails', 'Naruto. Come to take my chakra? You couldn\'t hold a drop of it.', 'right'),
          L('naruto', 'I\'m not asking you, fox. I\'m taking it. And I\'m not afraid of you anymore.'),
        ],
        boss: [
          L('e_nine_tails', 'You\'ll drown in hatred. Everyone who touches me does. Even you.'),
          L('naruto', 'Then I\'ll pull it out of you one handful at a time!'),
          L('e_nine_tails', 'Foolish… child.'),
        ],
        outro: [
          N('Red hair, and a voice he has never heard, saying his name.'),
          L('naruto', 'Who… who are you? You feel like… home.'),
        ],
      },
      n_countdown_3: {
        intro: [
          L('e_kisame_island', 'The intel goes to Tobi. Nobody on this island can stop me.', 'right'),
          L('guy', 'The Blue Beast of the Hidden Leaf can! DYNAMIC ENTRY!'),
          L('guy', 'I have forgotten your face three times, fish man. Not a fourth!'),
        ],
      },
      n_countdown_4: {
        intro: [
          N('Above the Hidden Rain. Paper against a mask.'),
          L('e_tobi', 'Konan. Nagato\'s eyes. Where are they? I won\'t ask twice.', 'right'),
          L('konan', 'Nagato believed in Naruto. So do I. You get nothing.'),
        ],
        boss: [
          L('e_tobi_boss', 'Kamui. You cannot touch what isn\'t there.'),
          L('konan', 'Six hundred billion paper bombs. Ten minutes. Even you have to breathe.'),
          L('e_tobi_boss', 'Izanagi. …That was expensive.'),
        ],
        outro: [
          N('Paper on the water. A flower, then nothing.'),
          L('konan', 'Nagato… I kept the rainbow. I kept it.'),
        ],
      },
    },
  },

  arc_confront: {
    opener: [
      N('The war. The dead walk.'),
      L('kakashi', 'Reanimated. Our own friends, our own dead. They\'ll keep coming back. Seal them.'),
      L('sakura', 'Then we don\'t kill them. We stop them. We can do that.'),
      L('guy', 'The dead cannot dampen YOUTH! Forward, Third Division!'),
      L('shikamaru', 'Sensei is out there somewhere. Ino, Choji. We\'re going to meet him.'),
    ],
    closer: [
      N('Night falls on the first day.'),
      L('gaara', 'The Second Tsuchikage is sealed. Onoki… you flew for hours. Sit down.'),
      L('onoki', 'My back! My back is a war crime! But we held, Kazekage. We held.'),
      L('naruto', 'Nagato\'s gone. Itachi\'s gone. Tomorrow… tomorrow I go to the real one.'),
    ],
    nodes: {
      n_confront_1: {
        intro: [
          L('e_zabuza_re', 'Kakashi. So the Leaf made you a commander. You\'ve grown, kid.', 'right'),
          L('kakashi', 'Zabuza. Haku. I\'m sorry you were dragged back. I\'ll be quick.'),
          L('e_haku_re', 'Zabuza… my body moves on its own. Please. Stop me.', 'right'),
        ],
      },
      n_confront_2: {
        intro: [
          L('e_kinkaku', 'The Cloud sent a child with our tools. Brother, the gourd.', 'right'),
          L('darui', 'Dull. This is going to be dull. But the Raikage gave me these, so… here goes.'),
          L('e_ginkaku', 'Say your most-used word, boy. The Amber Purification Jar hears you.', 'right'),
        ],
      },
      n_confront_3: {
        intro: [
          N('Asuma Sarutobi stands in the smoke, a cigarette that will not light.'),
          L('e_asuma_re', 'Shikamaru. Ino. Choji. Show me. One more time.', 'right'),
          L('choji', 'Sensei… I\'m not running this time. I promise. Ino-Shika-Cho!'),
        ],
        outro: [
          L('e_asuma_re', 'Good. That was… good. Take care of the king.'),
          L('shikamaru', 'We will, Sensei. Go rest. Kurenai says the baby kicks.'),
        ],
      },
      n_confront_4: {
        intro: [
          L('e_nagato_boss', 'Naruto. My body is not my own. Whatever it does… forgive it.', 'right'),
          L('itachi', 'Naruto. Bee. Stay close to me. The King of Hell will keep him standing.'),
          L('naruto', 'Nagato… I said I\'d never forget. Let\'s end this the right way.'),
        ],
        boss: [
          L('e_nagato_boss', 'The Rinnegan does not choose. It only sees. Planetary Devastation!'),
          L('naruto', 'You saw me once. See me again!'),
          L('e_nagato_boss', 'Itachi… thank you.'),
        ],
        outro: [
          L('itachi', 'Naruto. You\'ll be fine. Never forget your friends. Even the ones like him.'),
          N('The crow leaves. So does the man.'),
        ],
      },
      n_confront_5: {
        intro: [
          L('e_mu_boss', 'Onoki. My student. You still cannot see me. You never could.', 'right'),
          L('onoki', 'I can hear you, old man. That was always enough. Kazekage, the sand!'),
          L('gaara', 'Particle Style will erase anything it touches. Bury him before he finishes.'),
        ],
        boss: [
          L('e_mu_boss', 'Two of me. Which one is real? Particle Style: Atomic Dismantling Jutsu.'),
          L('gaara', 'Both. I have enough sand for both.'),
          L('e_mu_boss', 'Impressive, Kazekage.'),
        ],
        outro: [
          L('onoki', 'Sealed. Mu, you old ghost. Thank you for the lesson. And the back pain.'),
          L('gaara', 'Onoki. You can stop flying now. Please.'),
        ],
      },
    },
  },

  arc_climax: {
    opener: [
      N('The real Madara.'),
      L('onoki', 'That is Madara Uchiha. Not a clone. Not a copy. The one from the stories.'),
      L('tsunade', 'Then the stories end today. Five Kage. Together. Go.'),
      L('ay', 'Talk later! Move!'),
      N('The Kage assemble.'),
    ],
    closer: [
      N('One night left. The Ten-Tails looms over the battlefield.'),
      L('kakashi', 'Obito. It was you. All along.'),
      L('naruto', 'Sensei, whatever he is now… we fight him together. Team 7. All of it.'),
      L('sasuke', 'Team 7. Don\'t get used to saying it.'),
    ],
    nodes: {
      n_climax_1: {
        intro: [
          L('e_madara_re', 'A meteorite. Then another. Do the villages still make Kage?', 'right'),
          L('onoki', 'Fourth Division, HOLD! I can lift one! I can\'t lift two!'),
          L('gaara', 'Then hold the sky with me, Tsuchikage. Fifty seconds. The Kage are coming.'),
        ],
      },
      n_climax_2: {
        intro: [
          N('Inside the Four-Tails. The Sage Monkey King.'),
          L('e_four_tails', 'You dare speak my name, human? I am Son Goku, the Great Sage Monkey!', 'right'),
          L('naruto', 'Then let me say it right. Son Goku, I want to pull you out of that seal!'),
        ],
      },
      n_climax_3: {
        intro: [
          L('e_kabuto_sage_boss', 'Itachi. Sasuke. Both Uchiha in one place. Lord Orochimaru would be proud.', 'right'),
          L('itachi', 'Sasuke. Don\'t look at his eyes. Watch his hands. I\'ll handle the rest.'),
          L('sasuke', 'You\'ll explain later. Everything. And then I\'ll decide.'),
        ],
        boss: [
          L('e_kabuto_sage_boss', 'Sage of the Snakes. I surpassed Orochimaru. I surpassed all of you!'),
          L('itachi', 'Izanami. You will live this moment until you accept who you are, Kabuto.'),
          L('e_kabuto_sage_boss', 'Impossible. That\'s… that\'s the same rock. The same rock!'),
        ],
        outro: [
          L('itachi', 'Sasuke. No matter what you decide… I will love you always.'),
          N('The reanimation ends. The brother goes.'),
        ],
      },
      n_climax_4: {
        intro: [
          N('Three of them on the field. Side by side.'),
          L('sakura', 'I caught up. Both of you. Look at me. I caught up.'),
          L('naruto', 'Sakura, Sasuke… this is it. Team 7. Just like Kakashi-sensei said.'),
        ],
        outro: [
          L('sasuke', 'You\'ve both gotten stronger. Don\'t let it go to your heads.'),
          L('naruto', 'Says the guy who just said something nice. Did you hear that, Sakura?'),
        ],
      },
      n_climax_5: {
        intro: [
          N('Kamui. A place without sky. Two old teammates.'),
          L('e_obito_boss', 'Kakashi. You let her die. You let me die. Now you get to watch.', 'right'),
          L('kakashi', 'Obito. I carried you for years. I\'m not carrying this.'),
        ],
        boss: [
          L('e_obito_boss', 'Kamui. Strike between the moments, if you can find them.'),
          L('kakashi', 'I found one. Lightning Blade.'),
          L('e_obito_boss', 'Rin… would you have wanted this?'),
        ],
        outro: [
          L('kakashi', 'The old you was worth more than every dream you built for him.'),
          L('e_obito_boss', 'The old me… died in a cave. You just haven\'t noticed.'),
        ],
      },
    },
  },

  arc_anbu: {
    opener: [
      N('Years before Team 7. The Anbu.'),
      L('hiruzen', 'Kakashi. A mask, a mission, a village that never says thank you. Are you ready?'),
      L('kakashi', 'Ready, Lord Third. Which mask?'),
      L('hiruzen', 'The dog. And Kakashi… come back to the light when it\'s over. Promise me.'),
      N('He does not promise.'),
    ],
    closer: [
      L('hiruzen', 'You kept the Sharingan. And Kinoe kept his life. That was the right mission.'),
      L('kakashi', 'Lord Third… I think I\'d like to teach. One day. If anyone will have me.'),
      L('hiruzen', 'Come back to the light, Kakashi. There\'s a team waiting for you there.'),
      N('The main plot resumes: the night before the last night.'),
    ],
    nodes: {
      n_anbu_1: {
        intro: [
          L('kakashi', 'Transformation Jutsu. I\'m the Third Hokage for the next forty seconds.'),
          L('e_foundation_op', 'Lord Third? Alone? The Foundation will see you home.', 'right'),
          L('kakashi', 'Of course you will. Come closer, all of you.'),
        ],
      },
      n_anbu_2: {
        intro: [
          L('e_gotta', 'Yukimi belongs to the Iburi. Give her back and the smoke lets you breathe.', 'right'),
          L('kakashi', 'She isn\'t anyone\'s. Orochimaru made you, Gotta. Don\'t do his work for him.'),
          L('e_gotta', 'Then breathe it in, Anbu.', 'right'),
        ],
      },
      n_anbu_3: {
        intro: [
          L('e_kinoe_boss', 'Kakashi. Orders. The Sharingan comes with me, on your face or off it.', 'right'),
          L('kakashi', 'Kinoe. You don\'t have to follow him. Nobody has to.'),
          L('e_kinoe_boss', 'Wood Style: Four Pillar Prison. Then let\'s see who follows whom.', 'right'),
        ],
        boss: [
          L('e_kinoe_boss', 'Wood Style. The First Hokage\'s power, in me. The Foundation\'s gift.'),
          L('kakashi', 'It\'s not a gift. It\'s a leash. Let me cut it.'),
          L('e_kinoe_boss', 'Try.'),
        ],
        outro: [
          L('kakashi', 'Your Sharingan isn\'t yours to take, Kinoe. And your life isn\'t his.'),
          L('e_kinoe_boss', '…Tenzo. My name was Tenzo, once. I think I\'d like it back.', 'right'),
        ],
      },
    },
  },

  arc_birth: {
    opener: [
      N('The Ten-Tails has a host.'),
      L('minato', 'Obito. That\'s my student in there. And he just became a god.'),
      L('hashirama', 'Then we hold him as long as gods can be held. Tobirama, the barrier!'),
      L('naruto', 'Dad… Lord First… let me through. He\'s mine to reach.'),
      L('sasuke', 'Ours. He\'s ours, idiot.'),
    ],
    closer: [
      N('Guy is carried from the field. Naruto\'s hand rests on his chest.'),
      L('lee', 'Guy-sensei! You cannot die! Who will I shout at?!'),
      L('naruto', 'He\'s not dying, Bushy Brow. I won\'t let him. Not today.'),
      L('kakashi', 'Guy… you old fool. You beat Madara\'s respect out of him. Rest.'),
    ],
    nodes: {
      n_birth_1: {
        intro: [
          L('e_obito_jinchuriki', 'The Hokage. All of you. Kneel or be erased with your village.', 'right'),
          L('minato', 'Hashirama! The barrier won\'t hold him. Forty-five seconds, and then it\'s Naruto\'s.'),
          L('hashirama', 'Then we give him forty-five! Wood Style: everything I have!'),
        ],
      },
      n_birth_2: {
        intro: [
          L('naruto', 'Sasuke. Those black orbs erase everything. We hit him at the same time.'),
          L('sasuke', 'I know. I\'ve always known your timing. Try to keep up with mine.'),
          L('e_obito_jin_boss', 'Two children with borrowed power. Come, then.', 'right'),
        ],
        boss: [
          L('e_obito_jin_boss', 'The Ten-Tails\' Jinchuriki. I am the dream now. Truth-Seeking Balls.'),
          L('naruto', 'Your dream\'s a lie, Obito! Rin wouldn\'t want ANY of this!'),
          L('e_obito_jin_boss', 'Don\'t… say her name.'),
        ],
        outro: [
          N('The beasts\' chakra is pulled back, hand over hand.'),
          L('naruto', 'Obito. Come back. Kakashi-sensei\'s still waiting. He always was.'),
        ],
      },
      n_birth_3: {
        intro: [
          L('e_madara_sixpaths', 'Might Guy. The Third Division\'s green fool. Entertain me.', 'right'),
          L('guy', 'The Seventh Gate! Gate of Wonder! Daytime Tiger! Take it, Madara!'),
          L('guy', '…It wasn\'t enough. Then I know what comes next.'),
        ],
      },
      n_birth_4: {
        intro: [
          N('The Eighth Gate. Guy\'s blood turns to steam.'),
          L('guy', 'Gate of Death: OPEN! Lee… Kakashi… this is the springtime of my youth!'),
          L('e_madara_boss', 'Red steam. So the Leaf raised a taijutsu master after all.', 'right'),
        ],
        boss: [
          L('e_madara_boss', 'Madara Uchiha does not run from a man with no chakra. Show me the eighth gate.'),
          L('guy', 'NIGHT GUY!'),
          L('e_madara_boss', 'Magnificent. Truly.'),
        ],
        outro: [
          L('e_madara_boss', 'Of all the shinobi I have fought, none pushed me further. Rest, Might Guy.'),
          L('kakashi', 'Guy… you crazy, glorious fool. You did it. You actually did it.'),
        ],
      },
    },
  },

  arc_kaguya: {
    opener: [
      N('Black Zetsu\'s mother.'),
      L('e_kaguya', 'My children. My chakra, scattered into all of you. I will have it back.', 'right'),
      L('sakura', 'Who IS she? Naruto, Sasuke, she\'s not even looking at us like people.'),
      L('kakashi', 'The Sage of Six Paths\' mother. Kaguya Otsutsuki. Everything began with her.'),
      L('naruto', 'Then everything ends with us. Sasuke, together. Sakura, don\'t you dare fall behind.'),
    ],
    closer: [
      N('The end of the story. Every battle stays open.'),
      L('kakashi', 'It\'s over. It\'s actually over. Team 7… good work.'),
      L('sakura', 'Good work? They\'re missing arms, Sensei!'),
      L('kakashi', 'Missing arms, and still arguing. That\'s the Team 7 I remember.'),
    ],
    nodes: {
      n_kaguya_1: {
        intro: [
          L('e_kaguya', 'Lava. Ice. Sand. Choose the dimension you die in.', 'right'),
          L('sasuke', 'She shifts the world under us. Naruto, stay close. Don\'t fall.'),
          L('naruto', 'Forty-five seconds. Then we figure out how to seal a goddess!'),
        ],
      },
      n_kaguya_2: {
        intro: [
          L('e_kaguya', 'All-Killing Ash Bones. One touch and you are dust.', 'right'),
          L('sakura', 'She heals every nature we throw. Keep the counters ready, both of you!'),
          L('naruto', 'Sasuke, on my mark. Both hands. The seal.'),
        ],
        boss: [
          L('e_kaguya_boss', 'I am the beginning. Everything you call chakra was mine.'),
          L('naruto', 'Then take this back too! Sage Art: Super Tailed Beast Rasen-Shuriken!'),
          L('e_kaguya_boss', 'Children… why do you always resist your mother?'),
        ],
        outro: [
          N('Two hands on her. The seal closes. The moon returns to the sky.'),
          L('naruto', 'Sasuke… we did it. Sasuke? Why are you looking at me like that?'),
        ],
      },
      n_kaguya_3: {
        intro: [
          N('The Final Valley. Again.'),
          L('naruto', 'What do you mean to do, Sasuke? Just… say it plainly. For once.'),
          L('e_sasuke_final', 'A revolution. Every Kage, every beast, gone. And you first.', 'right'),
        ],
      },
      n_kaguya_4: {
        intro: [
          L('e_sasuke_final', 'Indra\'s Arrow. It\'s the last thing I have. It\'s enough.', 'right'),
          L('naruto', 'Rasen Shuriken. It\'s the last thing I have too.'),
          L('naruto', 'One more time, Sasuke. The last one.'),
        ],
        boss: [
          L('e_sasuke_final_boss', 'Why, Naruto? Why won\'t you ever give up on me?'),
          L('naruto', 'Because when you hurt, I hurt. That\'s all it ever was.'),
          L('e_sasuke_final_boss', '…Then let\'s finish it.'),
        ],
        outro: [
          N('Two boys on the ground. One arm each. The sun comes up over the valley.'),
          L('sasuke', '…I lose. Naruto. I lose.'),
        ],
      },
    },
  },
};
