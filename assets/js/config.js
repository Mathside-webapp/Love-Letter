/*
  ♡ TO BABI, WITH LOVE — THIS IS THE ONLY FILE YOU NEED TO EDIT.
  Her nickname is "Babi". Replace the sample texts with your own words.

  PHOTOS: put a JPEG / PNG / WebP file into the matching folders:
    memories -> assets/images/memories/
    reasons  -> assets/images/reasons/
    letters  -> assets/images/letters/
    gifts    -> assets/images/gifts/
  Example: image: "us-on-our-first-date.jpg". Empty "" = illustration / no photo.
  AUDIO: put your voice note in assets/audio/ and add audio: "miss-you.mp3".
  A letter's message can be an ARRAY of paragraphs, so it reads like a real letter.
  See CUSTOMIZE_ME_FIRST.md or tools/personalize.html (local editor).
  Everything below is SAMPLE writing until you personalize it.
*/
window.LOVE_SITE_DATA = {
  girlfriendName: "Babi",
  yourName: "Your Person", // Your name or nickname
  anniversaryDate: "", // YYYY-MM-DD, example "2024-11-01". Empty = no date counter
  heroMessage: "A little world I made, just for you, Babi.",
  introLine: "A little something for my Babi...",
  openingNote: "Babi, I put some of our moments into this little world. Every flower, every star and every hidden surprise is a small piece of what you mean to me. ♡",
  moonWish: "If I had one wish tonight, it would be for many more ordinary, wonderful days with you, Babi.",

  // A memory can have ONE image and a small extra gallery in extraImages.
  memories: [
    { date:"THE BEGINNING", title:"The Day We Met", message:"Some moments feel ordinary until they change everything. Meeting you was one of those moments, Babi.", image:"", extraImages:[], caption:"A moment I will always remember" },
    { date:"A FAVORITE DAY", title:"Our First Date", message:"I remember being beside you and wishing the hours moved more slowly. That day still makes me smile.", image:"", extraImages:[], caption:"The beginning of so many adventures" },
    { date:"ALL THE LITTLE THINGS", title:"Our Adventures", message:"I love all our memories—the exciting ones and the wonderfully simple ones.", image:"", extraImages:[], caption:"Our favorite little adventures" },
    { date:"TODAY & BEYOND", title:"Still Choosing You", message:"Life will bring new chapters, and I keep looking forward to writing them with you.", image:"", extraImages:[], caption:"And this is only the beginning" }
  ],

  // Each star has a unique personal message, optional photo and optional caption.
  reasons: [
    {title:"Your Smile",message:"Your smile can turn even the longest day into a good one.",image:"",caption:"A smile I never want to forget"},
    {title:"Your Kindness",message:"I love the gentle way you care about other people.",image:"",caption:"One of the many things I admire"},
    {title:"Our Laughter",message:"The silly moments with you are always my favorites.",image:"",caption:"Us being us"},
    {title:"Your Strength",message:"Even on difficult days, you remind me what courage looks like.",image:"",caption:"Stronger than you know"},
    {title:"The Little Things",message:"You remember details that make me feel seen.",image:"",caption:"It's the little things"},
    {title:"Your Voice",message:"Sometimes hearing your voice is enough to make my day feel lighter.",image:"",caption:"My favorite sound"},
    {title:"Our Peace",message:"With you, even quiet moments feel special.",image:"",caption:"Every moment matters"},
    {title:"Just You, Babi",message:"My favorite reason is simply that you are you, Babi.",image:"",caption:"Exactly who you are"}
  ],
  allStarsSurprise: "Eight stars, eight little reasons—and still not nearly enough. I love the beautiful person you are, Babi. ✨",

  // The three surprises are NOT identical letters. Each is a different mini activity.
  gifts: [
    {type:"promiseJar",title:"A Jar of Promises",subtitle:"Draw a tiny promise",image:"",promises:[
      "I promise to celebrate your small wins with you.",
      "I promise to keep making time for little adventures with my Babi.",
      "I promise to listen, even on days when things feel hard.",
      "I promise to remind you how much you mean to me."
    ]},
    {type:"dateRoulette",title:"Our Next Date",subtitle:"Let fate choose our adventure",image:"",dateIdeas:[
      "A cozy movie night with our favorite snacks 🍿",
      "A sunset walk and lots of pictures 🌅",
      "A café date where we choose each other's drinks ☕",
      "A little food adventure somewhere new 🍜"
    ]},
    {type:"coupons",title:"Babi's Love Coupons",subtitle:"Choose a little treat",image:"",coupons:[
      "One extra-long hug — anytime 🤗",
      "A date planned just for you 🌷",
      "Your choice of movie, no complaints 🎬"
    ]}
  ],

  // Letters support multiple PARAGRAPHS, PHOTO, and VOICE NOTE per envelope.
  // You can add more letters by copying one of these objects in the array.
  openWhen: [
    {label:"You Miss Me", title:"When you miss me, Babi", image:"",audio:"",stamp:"A HUG FROM AFAR",message:[
      "Hi, Babi. If you're reading this, maybe you wish I were right there with you.",
      "I wish I could hold your hand right now. Until then, remember the moments we've shared and all the new ones waiting for us.",
      "Sending you the biggest hug. ♡"
    ]},
    {label:"You're Sad",title:"When you're feeling sad",image:"",audio:"",stamp:"ON THE HARD DAYS",message:[
      "Babi, you don't have to force a smile for me.",
      "Some days are difficult, and you deserve softness and patience through them. I wish I could take a little weight off your shoulders.",
      "I'm always cheering for you. ♡"
    ]},
    {label:"You're Stressed",title:"When life feels too much",image:"",audio:"",stamp:"ONE BREATH AT A TIME",message:[
      "One thing at a time, Babi. You don't have to carry the whole world today.",
      "Take a little break. Drink some water. Rest. You have already made it through so much, and I believe in you.",
      "I'll be right here to listen. ♡"
    ]},
    {label:"You're Happy",title:"When you're feeling happy",image:"",audio:"",stamp:"A LITTLE CELEBRATION",message:[
      "Babi, if something made you smile today, I hope it made your whole heart feel warm.",
      "Your wins matter to me—big, small, and everything in between.",
      "Save a little of that smile for our next date! ♡"
    ]}
  ],

  finalPhoto:"", // Optional image in assets/images/letters/
  finalLetter:[
    "My dearest Babi,",
    "Of all the lovely things life has brought me, one of the most beautiful is getting to know you.",
    "I treasure our tiny moments: the shared laughs, the silly photos, the quiet conversations, and even the most ordinary days.",
    "Thank you for being part of my story. Whatever the next chapter brings, I hope we'll keep writing it together.",
    "Happy anniversary, Babi. I'd still choose you, every single time.",
    "Always yours. ♡"
  ]
};
