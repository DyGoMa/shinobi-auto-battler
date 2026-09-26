// story/shippuden-a.js — the dialogue of Shippuden arcs 9–16 (docs/STORY_PLAN.md). Pure data,
// same shape as story/part1.js. Spoiler discipline: Tobi is "Tobi", Pain is "Pain", and the
// truth about Itachi stays a caption.
const N = (caption) => ({ caption });
const L = (who, text, side = null) => (side ? { who, text, side } : { who, text });

export const SHIPPUDEN_A_STORY = {
  arc_kazekage: {
    opener: [
      N('Two and a half years later. The gate of the Hidden Leaf.'),
      L('naruto', 'I\'m back! The village looks smaller. Or I got taller. Definitely taller.'),
      L('sakura', 'You\'re taller. Barely. Kakashi-sensei wants us at the training ground.'),
      L('kakashi', 'Before that: the Hidden Sand sent word. Gaara has been taken. By the Akatsuki.'),
      L('naruto', 'Gaara? Then what are we standing here for?'),
    ],
    closer: [
      N('The Hidden Sand bows to its Kazekage.'),
      L('gaara', 'They came for me. All of them. I didn\'t know a village could do that.'),
      L('naruto', 'That\'s what a Kazekage gets. Next time I see you, I\'ll be a jonin. Or Hokage.'),
      L('kakashi', 'Naruto. Walk slower. I\'m the one who can\'t stand up.'),
    ],
    nodes: {
      n_kaz_1: {
        intro: [
          L('kakashi', 'Two bells. Same as before. Show me what two and a half years bought you.'),
          L('sakura', 'He\'s not reading this time. Naruto, he\'s taking us seriously.'),
          L('naruto', 'Good. Because so am I. Shadow Clone Jutsu!'),
        ],
      },
      n_kaz_2: {
        intro: [
          N('The Hidden Sand, night. A clay bird circles the walls.'),
          L('e_deidara_sand', 'The Kazekage himself. The Akatsuki sends its regards, hm.', 'right'),
          L('gaara', 'This village is mine to protect. Not one grain of it falls tonight.'),
        ],
      },
      n_kaz_3: {
        intro: [
          L('guy', 'The barrier tags are off, and look who\'s waiting! Ourselves!'),
          L('lee', 'Guy-sensei, my copy has the same eyebrows. He is magnificent.'),
          L('guy', 'No holding back on ourselves, Lee! That is the ultimate training!'),
        ],
      },
      n_kaz_4: {
        intro: [
          L('chiyo', 'Sasori of the Red Sand. My grandson. I taught him everything but this.'),
          L('sakura', 'Then teach me the rest, Lady Chiyo. I\'ll be your hands.'),
          L('e_sasori_boss', 'Grandmother. And a little girl. Hiruko will be bored.', 'right'),
        ],
        boss: [
          L('e_sasori_boss', 'Art is eternal, girl. Let me show you how a puppet outlives its maker.'),
          L('sakura', 'Then I\'ll break every one of them. Cha!'),
          L('e_sasori_boss', 'Secret Red Move: Performance of a Hundred Puppets. Dance.'),
        ],
        outro: [
          L('chiyo', 'He walked into my poison himself. My grandson, choosing… a hug.'),
          L('sakura', 'Lady Chiyo… we have to go. Gaara is still out there.'),
        ],
      },
      n_kaz_5: {
        intro: [
          N('Over the forest. A clay bird climbs with the Kazekage in its claws.'),
          L('kakashi', 'Naruto, don\'t rush him. He blows up everything he touches.'),
          L('naruto', 'Then I\'ll touch him first! Give him back!'),
        ],
        boss: [
          L('e_deidara_boss', 'The Nine-Tails jinchuriki. You\'re next on the list, hm.'),
          L('naruto', 'I don\'t care about your list! Give Gaara back!'),
          L('e_deidara_boss', 'Watch the sky. My art is fleeting. You won\'t be.'),
        ],
        outro: [
          N('Chiyo\'s hands on Gaara\'s chest. Her last jutsu.'),
          L('gaara', '…Naruto? Why is everyone… standing around me?'),
        ],
      },
    },
  },

  arc_tenchi: {
    opener: [
      N('A new Team Kakashi.'),
      L('yamato', 'Yamato. I\'ll be your captain while Kakashi recovers. And this is Sai.'),
      L('sai', 'Hello. I\'ve read that a smile puts people at ease. Is it working?'),
      L('naruto', 'No! Who smiles like that? Sasuke\'s seat isn\'t for a guy who smiles like that!'),
      L('sakura', 'Naruto. We have a mission. A spy, a bridge, and maybe… maybe Sasuke.'),
    ],
    closer: [
      L('sai', 'I painted something for you both. I didn\'t know what to call it.'),
      L('naruto', 'It\'s us. It\'s the three of us. You put yourself in it.'),
      L('sai', 'Is that… allowed?'),
      N('Sai smiles. This time it reaches his eyes.'),
    ],
    nodes: {
      n_tenchi_1: {
        intro: [
          L('yamato', 'I play the spy, you play the team. Naruto, Sai: work together or fail together.'),
          L('sai', 'Working with the dickless wonder. This should be educational.'),
          L('naruto', 'THAT\'S IT. Yamato, count us in before I paint him first.'),
        ],
      },
      n_tenchi_2: {
        intro: [
          L('e_kabuto', 'Sasori. You\'re late. The information first, then the antidote.', 'right'),
          L('yamato', 'Of course. Come closer, Kabuto. Closer.'),
          L('e_orochimaru_p2', 'Kabuto. Step away from the puppet. It is not who it says it is.', 'right'),
        ],
      },
      n_tenchi_3: {
        intro: [
          N('Four tails of red chakra. The bridge is gone.'),
          L('e_orochimaru_p2', 'There it is. The Nine-Tails\' little friend. Show me more.', 'right'),
          L('yamato', 'Sakura, stay back! That isn\'t Naruto right now. Wood Style!'),
        ],
        outro: [
          L('sakura', 'Naruto… you hurt me and you don\'t even remember. I\'m not telling you.'),
          L('yamato', 'Let him wake up first. Then we decide what he gets to know.'),
        ],
      },
      n_tenchi_4: {
        intro: [
          N('The hideout. Sasuke stands above them, a sword at his back.'),
          L('naruto', 'Sasuke… you\'re really here. Three years. You didn\'t even write.'),
          L('sasuke', 'Naruto. Sakura. Still chasing. I told you to stop.', 'right'),
        ],
        boss: [
          L('e_sasuke_tenchi', 'I have no reason to kill you yet. Don\'t give me one.'),
          L('naruto', 'Then give ME one! Come home, or fight me for real!'),
          L('e_sasuke_tenchi', 'Chidori Stream. That was your answer.'),
        ],
        outro: [
          L('sasuke', 'Orochimaru. We\'re leaving. There\'s nothing for me here.'),
          L('naruto', 'Sakura. Next time we bring him back together. All of us. Sai too.'),
        ],
      },
    },
  },

  arc_twelve: {
    opener: [
      N('Side mission. The Fire Temple.'),
      L('asuma', 'I trained here once. The monks and the Twelve Guardian Ninja. Another life.'),
      L('e_sora', 'Leaf ninja. The temple doesn\'t need you. I don\'t need you.', 'right'),
      L('naruto', 'Nobody asked you, monk boy. Who\'s the guy with the bandaged arm?'),
      L('asuma', 'His name is Sora. And that arm is the reason we\'re here.'),
    ],
    closer: [
      L('e_sora', 'I\'m leaving. Not with you. I have to find out what I am.', 'right'),
      L('naruto', 'Then come back when you know. I\'ll still be loud.'),
      L('asuma', 'Chiriku and I… we\'ll have that drink another time. Rest easy, old friend.'),
      N('The main plot resumes: the Akatsuki are hunting.'),
    ],
    nodes: {
      n_twelve_1: {
        intro: [
          L('e_fuka', 'Such a lovely young man. One kiss and you\'re mine. All of you.', 'right'),
          L('naruto', 'Nobody\'s kissing anybody! Yamato, she\'s creepy!'),
          L('e_fudo', 'Fuka. Stop playing. Rock Armour. Let them break their hands.', 'right'),
        ],
      },
      n_twelve_2: {
        intro: [
          L('e_sora', 'It\'s in my arm. It\'s in my ARM. Get away from me, it\'s coming out!', 'right'),
          L('yamato', 'That\'s the Nine-Tails\' chakra. Somebody planted it in him. Naruto, hold him!'),
          L('naruto', 'Sora! Fight it! You\'re stronger than the fox! I should know!'),
        ],
      },
      n_twelve_3: {
        intro: [
          L('e_kazuma_boss', 'Asuma. You could have stood with us. The Fire Temple could have been the capital.', 'right'),
          L('asuma', 'Kazuma. Chiriku is dead because of you. Sora is broken because of you.'),
          L('sai', 'Asuma. He raises the dead as soil. I\'ll pin them. You finish it.'),
        ],
        boss: [
          L('e_kazuma_boss', 'Of the Twelve Guardian Ninja, only I saw the truth. Fire needs a king.'),
          L('asuma', 'Fire needs a village. That\'s what Chiriku died knowing.'),
          L('e_kazuma_boss', 'Then join him.'),
        ],
        outro: [
          L('asuma', 'It\'s done. Sora… he was your father, and he used you like a tool.'),
          L('e_sora', 'I know. I\'ve always known. I just wanted him to say my name once.', 'right'),
        ],
      },
    },
  },

  arc_hidan: {
    opener: [
      N('Two Akatsuki. One bounty station.'),
      L('e_hidan', 'Kakuzu, let me finish praying! Lord Jashin does not like to be rushed!', 'right'),
      L('e_kakuzu', 'Your god can wait. The bounty can\'t. Pick up the body.', 'right'),
      L('asuma', 'Shikamaru. Whatever happens in there: the ritual is the danger. Not the scythe.'),
      L('shikamaru', 'Right. Ritual. Scythe. Two immortal freaks. What a drag.'),
    ],
    closer: [
      N('Asuma\'s grave. Rain on the stones.'),
      L('kurenai', 'He said you\'d come to the grave and play one last game. He was right.'),
      L('shikamaru', 'He always cheated at shogi. I\'m going to miss that most.'),
      L('shikamaru', 'One cigarette. Then I quit. He\'d want the kids to be born without the smell.'),
    ],
    nodes: {
      n_hidan_1: {
        intro: [
          L('e_hidan', 'Leaf ninja! Oh, this is a gift. Lord Jashin, I\'ll make it slow.', 'right'),
          L('asuma', 'Ino, Shikamaru: keep him off the circle. If he tastes blood, someone dies.'),
          L('shikamaru', 'The circle. Got it. Choji, don\'t let him near his own drawing.'),
        ],
        outro: [
          N('The ritual finds its mark between the battles. Asuma Sarutobi falls.'),
          L('shikamaru', 'Sensei… I\'ll take the king from here. Just… give me a minute.'),
        ],
      },
      n_hidan_2: {
        intro: [
          L('kakashi', 'Kakuzu\'s skin hardens. Hit him when he strikes, not when he waits.'),
          L('e_kakuzu', 'The Copy Ninja. Your heart will do nicely. I\'m short one.', 'right'),
          L('ino', 'Those masks came out of his BACK. Choji, I take it back, eat something.'),
        ],
      },
      n_hidan_3: {
        intro: [
          N('The Nara forest. Deer watch from the trees.'),
          L('e_hidan', 'Alone? You brought me here alone? Lord Jashin loves a fool.', 'right'),
          L('shikamaru', 'Not alone. This is my family\'s forest. And I\'ve already planned your move.'),
        ],
        boss: [
          L('e_hidan_boss', 'I can\'t die, kid! Cut me, burn me, I get up and I pray!'),
          L('shikamaru', 'Then you can pray in pieces. Shadow Possession. Walk where I say.'),
          L('e_hidan_boss', 'A shadow? That\'s your plan? Lord Jashin! Hear me laugh!'),
        ],
        outro: [
          L('shikamaru', 'This is my king\'s move. Asuma\'s lighter. Burn.'),
          L('shikamaru', 'Stay in the hole, Hidan. The deer will keep you company forever.'),
        ],
      },
      n_hidan_4: {
        intro: [
          L('naruto', 'It\'s ready. My new jutsu. Kakashi-sensei, I need one clean shot.'),
          L('kakashi', 'You\'ll get one. Yamato and I will make sure of it.'),
          L('e_kakuzu', 'Another child. Five hearts, boy. You\'ll run out of jutsu before I run out.', 'right'),
        ],
        boss: [
          L('e_kakuzu_boss', 'Wind, Fire, Lightning, Earth. Each heart a nature. Which one kills you?'),
          L('naruto', 'Wind Style: Rasen Shuriken! The one that goes through all of them!'),
          L('e_kakuzu_boss', 'Impossible. That\'s… impossible.'),
        ],
        outro: [
          L('kakashi', 'It landed. Naruto, that jutsu surpasses the Fourth\'s. Now let me carry you.'),
          L('naruto', 'Did we win? Sensei? Tell Shikamaru… we won.'),
        ],
      },
    },
  },

  arc_threetails: {
    opener: [
      N('Side mission. A lake in the mist.'),
      L('e_guren_boss', 'Crystal Style. Everything I touch becomes beautiful and still. Even you.', 'right'),
      L('kakashi', 'Orochimaru\'s people. And a tailed beast under that water. Kurenai, your team leads.'),
      L('kurenai', 'Shino, Kiba, Hinata: eyes open. Mist and crystal both lie.'),
      L('naruto', 'A boy came out of the fog. He said the lake was his mother. What does that mean?'),
    ],
    closer: [
      L('e_guren_boss', 'Yukimaru. I\'m done with Orochimaru. I\'m not done with you.', 'right'),
      L('naruto', 'She\'s leaving with him. Should we… stop her?'),
      L('kakashi', 'She just chose a child over a master. Let her walk.'),
      N('The main plot resumes: Sasuke has left Orochimaru.'),
    ],
    nodes: {
      n_three_1: {
        intro: [
          L('e_kigiri', 'Smoke. Breathe it in, Leaf. You won\'t see the next one coming.', 'right'),
          L('e_nurari', 'I\'ll slip past the front. The back line never expects water.', 'right'),
          L('hinata', 'Byakugan. I can see them. Kiba, two o\'clock. Shino, the low one.'),
        ],
      },
      n_three_2: {
        intro: [
          L('e_guren_boss', 'Jade Crystal Mirror. Strike it and you strike yourself.', 'right'),
          L('kakashi', 'Then don\'t strike it. Wait until the mirror\'s down. Everyone hold.'),
          L('naruto', 'Holding is the worst thing! Fine! Holding!'),
        ],
        boss: [
          L('e_guren_boss', 'I was chosen. Do you know what that\'s worth to someone like me?'),
          L('naruto', 'Yukimaru\'s waiting for you. That\'s worth more. Snap out of it!'),
          L('e_guren_boss', 'Crystal Style: Jade Crystal Mirror!'),
        ],
        outro: [
          L('e_guren_boss', 'The mirror… broke. Nothing breaks my crystal. Nothing.'),
          L('naruto', 'A promise did. You made one to a kid. Now keep it.'),
        ],
      },
      n_three_3: {
        intro: [
          N('The lake rises. Yukimaru screams for his mother, and the beast answers.'),
          L('kakashi', 'The Three-Tails. Don\'t try to kill it. Drive it back under.'),
          L('kiba', 'Drive it back? It\'s the size of the LAKE, Kakashi!'),
        ],
        boss: [
          N('The Three-Tails roars. The sound has no words and needs none.'),
          L('naruto', 'Yukimaru! Stop crying! It listens to you! Tell it to go home!'),
          L('e_guren_boss', 'Yukimaru… I\'m here. Look at me. Only me.', 'right'),
        ],
        outro: [
          N('The beast sinks. The water goes still.'),
          L('naruto', 'It just… went home. Guren, he stopped crying because of you.'),
        ],
      },
    },
  },

  arc_itachi: {
    opener: [
      N('Sasuke has no master now.'),
      L('sasuke', 'Suigetsu. Karin. Jugo. We hunt Itachi Uchiha. Nothing else matters.'),
      L('suigetsu', 'Sure, boss. I get Kisame\'s sword after, right? That was the deal.'),
      L('karin', 'Sasuke, I sense three of the Akatsuki nearby. The clay one is closest.'),
      L('jugo', 'Sasuke… if I lose myself out there, don\'t let me hurt anyone.'),
    ],
    closer: [
      L('sasuke', 'Deidara is dead. Itachi is next. Ride.'),
      L('suigetsu', 'You almost died back there and that\'s all you say? Cold.'),
      L('karin', 'He\'s not cold. He\'s… focused. Right, Sasuke?'),
      N('Taka rides on. Toward the Uchiha hideout.'),
    ],
    nodes: {
      n_itachi_1: {
        intro: [
          L('e_jugo', 'Leave. Leave now. The other me wants to kill you and he\'s waking up.', 'right'),
          L('sasuke', 'Then wake him. I need the one who fights, not the one who begs.'),
          L('karin', 'Sasuke, his chakra is doubling! It\'s not human!'),
        ],
      },
      n_itachi_2: {
        intro: [
          L('e_tobi', 'Deidara-senpai! It\'s the Sharingan boy! He looks so serious!', 'right'),
          L('e_deidara_clash', 'Tobi. Shut up and get out of the way. Uchiha eyes. I hate Uchiha eyes.', 'right'),
          L('sasuke', 'Then I\'ll take them out of your sight.'),
        ],
      },
      n_itachi_3: {
        intro: [
          N('Above the forest. The clay sculptor has one work left.'),
          L('e_deidara_art', 'You look at my art like it\'s nothing. Like your brother did.', 'right'),
          L('sasuke', 'It is nothing. Finish it or I will.'),
        ],
        boss: [
          L('e_deidara_art', 'Art is an explosion! C4 Karura! Breathe it in, Uchiha!'),
          L('sasuke', 'I see every particle. Your art is slow.'),
          L('e_deidara_art', 'Then see THIS. C0. The final work. Me.'),
        ],
        outro: [
          N('The sky goes white for miles.'),
          L('sasuke', 'Karin. Get me out. I can\'t feel my arm.'),
        ],
      },
    },
  },

  arc_jiraiya: {
    opener: [
      N('The Village Hidden in the Rain. It never stops.'),
      L('jiraiya', 'Rain that never ends. That\'s a jutsu, not weather. Someone is watching every drop.'),
      L('jiraiya', 'Pa, Ma, stay in the pocket. This one, Jiraiya the Gallant does alone.'),
      L('jiraiya', 'Three kids I taught in this country. Let\'s see what they became.'),
      N('He walks through the gate as a stranger.'),
    ],
    closer: [
      N('A bench in the Hidden Leaf. A popsicle. A book.'),
      L('naruto', 'Pervy Sage wrote this for me. The hero\'s name is Naruto. He named me after a book.'),
      L('shikamaru', 'He named you after a hero. Now you have to be one. What a drag, huh.'),
      L('naruto', 'Yeah. What a drag. Let\'s go, Shikamaru. I have work to do.'),
    ],
    nodes: {
      n_jiraiya_1: {
        intro: [
          L('e_rain_ninja', 'Halt! Nobody enters the Rain without the Lord\'s permission!', 'right'),
          L('jiraiya', 'Lord? Which lord? I knew a boy here once. He liked toads.'),
          L('jiraiya', 'Never mind. You\'ll talk after the toad.'),
        ],
      },
      n_jiraiya_2: {
        intro: [
          L('e_konan', 'Sensei. You should not have come.', 'right'),
          L('jiraiya', 'Konan. You grew up. You grew up making paper into knives.'),
          L('e_konan', 'You taught us to survive. This is what surviving looks like.', 'right'),
        ],
      },
      n_jiraiya_3: {
        intro: [
          L('jiraiya', 'Sage Mode. Pa, Ma: I need the toad eyes. It\'s time.'),
          L('e_pain_animal', 'The toad sage. Summoning Jutsu.', 'right'),
          L('jiraiya', 'A rhino, a bird, and a dog that won\'t stop multiplying. Lovely.'),
        ],
      },
      n_jiraiya_4: {
        intro: [
          N('Six figures on the water. Three of them he has already beaten.'),
          L('e_pain_sixpaths', 'Jiraiya-sensei. Did you find your answer? The one about peace?', 'right'),
          L('jiraiya', 'Not yet. But I found the kid who will. That was always the answer.'),
        ],
        boss: [
          L('e_pain_sixpaths', 'You taught us, and this is what we learned. Pain is the answer. Feel it.'),
          L('jiraiya', 'Then I\'ll write one more chapter before I close the book.'),
          L('e_pain_sixpaths', 'The book is already closed, Sensei.'),
        ],
        outro: [
          N('A coded message, carved into a toad\'s back, sinks with the sage.'),
          L('jiraiya', 'The Tale of Jiraiya the Gallant… ends here. The sequel is Naruto\'s.'),
        ],
      },
    },
  },

  arc_brothers: {
    opener: [
      N('The Uchiha hideout. Kisame guards the door.'),
      L('kisame', 'Only Sasuke goes in. Itachi\'s orders. The rest of you can play with me.', 'right'),
      L('suigetsu', 'Kisame Hoshigaki. And Samehada. Oh, I\'ve waited YEARS for this.'),
      L('sasuke', 'Suigetsu. Don\'t die. I\'ll be back for the sword.'),
      L('karin', 'Sasuke… his chakra in there. It\'s not what I expected. It\'s… sad.'),
    ],
    closer: [
      L('sasuke', 'I\'m going to crush the Hidden Leaf. Every last stone of it.'),
      L('jugo', 'Sasuke. Whatever you were told in there, you don\'t have to become it.'),
      L('sasuke', 'I already have.'),
      N('Tobi watches from the trees. He does not clown this time.'),
    ],
    nodes: {
      n_brothers_1: {
        intro: [
          L('e_kisame_p2', 'Samehada is hungry. And you three look full of chakra.', 'right'),
          L('suigetsu', 'That sword eats chakra? Good. I\'m made of water. Chew on that.'),
          L('karin', 'Just hold him! Sasuke needs time! Jugo, don\'t lose it, not now!'),
        ],
      },
      n_brothers_2: {
        intro: [
          N('The hideout. Two brothers. A throne of stone.'),
          L('e_itachi_boss', 'Sasuke. You have your eyes. Show me how much you hate me.', 'right'),
          L('sasuke', 'You\'ll see it. Then you\'ll stop seeing anything at all.'),
        ],
        boss: [
          L('e_itachi_boss', 'Amaterasu. Black flames that never go out. Like your hatred.'),
          L('sasuke', 'Kirin. One shot. Everything I have. Take it, brother.'),
          L('e_itachi_boss', 'Susanoo. You still have a long way to go.'),
        ],
        outro: [
          L('itachi', 'Sorry, Sasuke. There won\'t be a next time.'),
          N('Two fingers touch a forehead. The truth waits for another day.'),
        ],
      },
      n_brothers_3: {
        intro: [
          L('e_bee', 'Yo, Taka, four in a row, came to catch the Bee, well here\'s the show!', 'right'),
          L('suigetsu', 'Is he… rapping? Sasuke, he\'s rapping at us.'),
          L('sasuke', 'Let him. Rhymes don\'t block a sword.'),
        ],
      },
      n_brothers_4: {
        intro: [
          N('Unraikyo. The valley shakes as the host lets the beast out.'),
          L('e_eight_tails', 'You wanted the Eight-Tails, fool, ya fool? Here I am. All of me.', 'right'),
          L('karin', 'Sasuke! That much chakra should not exist! We have to run!'),
        ],
        boss: [
          L('e_eight_tails', 'Tailed Beast Bomb. Say hi to your brother.'),
          L('sasuke', 'Not before I say it to you.'),
          L('e_eight_tails', 'Weeee! Wait, no. WHEEE!'),
        ],
        outro: [
          L('suigetsu', 'We got him! We got the… wait. That\'s a tentacle. We got a TENTACLE.'),
          L('sasuke', 'He fooled us. Fine. Let the Akatsuki think we won. We move on.'),
        ],
      },
    },
  },
};
