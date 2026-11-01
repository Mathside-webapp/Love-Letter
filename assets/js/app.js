/* To You, With Love — vanilla JavaScript, no framework and no account needed. */
(() => {
  "use strict";
  const data = window.LOVE_SITE_DATA;
  if (!data) { console.error("Could not load assets/js/config.js"); return; }
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const SPRITES = "assets/images/sprites/";
  // Decor photo frames are actual HTML frames. The selected photo and its
  // border are the SAME animated element, so they can never drift apart.
  (data.memories || []).slice(0,2).forEach((memory,index)=>{
    const number=index+1;
    const img=document.getElementById(`storyCoverPhoto${number}`);
    const caption=document.getElementById(`storyCoverCaption${number}`);
    if(!img)return;
    const rawName=memory?.image;
    if(typeof rawName==='string' && /^[\w.\- ]+\.(png|jpe?g|webp|avif)$/i.test(rawName)){
      img.src=`assets/images/memories/${encodeURIComponent(rawName)}`;
      img.addEventListener('error',()=>{
        img.src=index===0?'assets/images/backgrounds/hero-desktop.webp':'assets/images/backgrounds/our-story.webp';
      },{once:true});
    }
    img.alt=`A memory with Babi: ${memory.title || 'Our story'}`;
    if(caption) caption.textContent=memory?.caption?.trim() || memory?.title || 'Us ♡';
  });
  const backgrounds = [
    "assets/images/backgrounds/hero-desktop.webp",
    "assets/images/backgrounds/our-story.webp",
    "assets/images/backgrounds/why-i-love-you.webp",
    "assets/images/backgrounds/hero-mobile.webp"
  ];
  const state = { gifts: new Set(), seenReasons: new Set(), music: false, audio: null, audioTimer: null, noteIndex: 0 };
  document.documentElement.classList.add("has-js");
  const dialog = $("#loveDialog");
  const dialogBody = $("#dialogBody");

  function text(node, value) { if (node) node.textContent = value ?? ""; }
  function validImage(name) { return typeof name === "string" && /^[\w.\- ]+\.(png|jpe?g|webp|avif)$/i.test(name) && name !== "."; }
  function validAudio(name) { return typeof name === "string" && /^[\w.\- ]+\.(mp3|m4a|ogg|wav)$/i.test(name); }
  const photoPath = (name, folder) => validImage(name) ? `assets/images/${folder}/${encodeURIComponent(name)}` : "";
  const toParagraphs = message => Array.isArray(message) ? message : (message ? [message] : []);
  function addMedia(body, photo = "", images = [], caption = "", audio = "") {
    const collection = [photo, ...(Array.isArray(images) ? images : [])].filter(Boolean);
    if (collection.length) {
      const figure = document.createElement("figure"); figure.className = "memory-gallery";
      const img = document.createElement("img"); img.src = collection[0]; img.alt = caption || "One of our favorite memories";
      img.className = "dialog-photo"; img.addEventListener("error",()=>img.remove(),{once:true});
      figure.append(img);
      if (caption) figure.append(itemWithText("figcaption",caption,"gallery-caption"));
      if (collection.length > 1) {
        const thumbs = document.createElement("div");thumbs.className="gallery-thumbnails";
        collection.forEach((url,index)=>{
          const thumb=document.createElement("button");thumb.type="button";thumb.className="gallery-thumb"+(index===0?" active":"");thumb.setAttribute("aria-label",`Show photo ${index+1}`);
          const preview=document.createElement("img");preview.src=url;preview.alt="";preview.loading="lazy";thumb.append(preview);
          thumb.addEventListener("click",()=>{img.src=url;$$('.gallery-thumb',thumbs).forEach(t=>t.classList.toggle('active',t===thumb));});thumbs.append(thumb);
        });figure.append(thumbs);
      }
      body.append(figure);
    }
    if (audio && validAudio(audio)) {
      const block=document.createElement('div');block.className='voice-note';
      block.append(itemWithText('span','♫ A little voice note from me','voice-label'));
      const player=document.createElement('audio');player.controls=true;player.preload='none';player.src=`assets/audio/${encodeURIComponent(audio)}`;
      player.setAttribute('aria-label','Personal recorded voice message');block.append(player);body.append(block);
    }
  }
  function itemWithText(tag, value, className = "") {
    const el = document.createElement(tag);
    el.textContent = value;
    if (className) el.className = className;
    return el;
  }
  function showDialog({eyebrow = "A LITTLE NOTE FOR YOU", title = "Just for you", paragraphs = [], photo = "", images = [], caption = "", audio = "", signoff = "With all my love ♡"}) {
    text($("#dialogEyebrow"), eyebrow);
    text($("#dialogTitle"), title);
    text($("#dialogSignoff"), signoff);
    dialogBody.replaceChildren();
    addMedia(dialogBody,photo,images,caption,audio);
    toParagraphs(paragraphs).forEach(line => { if (line) dialogBody.append(itemWithText("p", line)); });
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop=0;
  }
  // Add actual interactive content inside an unwrapped gift; no backend required.
  function addGiftExperience(gift,index) {
    const box=document.createElement('section');box.className='mini-experience';
    const result=itemWithText('p','', 'mini-result');
    const cta=itemWithText('button','', 'mini-experience-action');cta.type='button';
    const pickFrom=arr=>{ if(!arr?.length) return 'A new memory with Babi ♡';return arr[Math.floor(Math.random()*arr.length)]; };
    if (gift.type==='promiseJar') {
      box.append(itemWithText('div','✧','mini-icon'),itemWithText('h3','Babi’s promise jar','mini-title'));
      text(result,'Each time you open the jar, a promise appears.');text(cta,'Draw a promise ✨');
      cta.addEventListener('click',()=>{text(result,pickFrom(gift.promises));result.classList.remove('pop');void result.offsetWidth;result.classList.add('pop');});
      box.append(result,cta);
    } else if (gift.type==='dateRoulette') {
      box.append(itemWithText('div','✦','mini-icon'),itemWithText('h3','Our next little adventure','mini-title'));
      text(result,'Where shall our next date take us?');text(cta,'Surprise me with a date ♡');
      cta.addEventListener('click',()=>{text(result,pickFrom(gift.dateIdeas));result.classList.remove('pop');void result.offsetWidth;result.classList.add('pop');});
      box.append(result,cta);
    } else if (gift.type==='coupons') {
      box.append(itemWithText('div','♡','mini-icon'),itemWithText('h3','Love coupons for Babi','mini-title'));
      (gift.coupons || []).forEach((coupon,i)=>{
        const row=document.createElement('div');row.className='coupon-row';
        row.append(itemWithText('span',coupon));
        const copy=itemWithText('button','Copy','coupon-copy');copy.type='button';copy.setAttribute('aria-label',`Copy coupon ${i+1}`);
        copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(coupon);text(copy,'Copied!');}catch{ text(copy,'Select text'); }});
        row.append(copy);box.append(row);
      });
    } else {text(result,gift.message||'Wrapped especially for you ♡');box.append(result);}
    if (gift.image && validImage(gift.image)) addMedia(box,photoPath(gift.image,'gifts'));
    dialogBody.append(box);
  }
  $("#dialogClose").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });

  // Intro letter: shown once per tab/session; can be reopened from the ending.
  const intro = $("#introScreen");
  const pageBody = document.body;
  const introSeen = (() => { try { return sessionStorage.getItem("loveIntroSeen") === "yes"; } catch { return false; } })();
  function closeIntro() {
    intro.classList.add("hidden");
    intro.setAttribute("aria-hidden", "true");
    pageBody.classList.remove("intro-locked");
    try { sessionStorage.setItem("loveIntroSeen", "yes"); } catch {/* browser storage can be restricted */}
    $("#heroHeading").setAttribute("tabindex", "-1");
    $("#heroHeading").focus({preventScroll:true});
    if (!reduceMotion.matches) burstAt(window.innerWidth / 2, window.innerHeight / 2, 12);
  }
  if (introSeen) {
    intro.classList.add("hidden");
    intro.setAttribute("aria-hidden", "true");
    pageBody.classList.remove("intro-locked");
  }
  $("#openIntro").addEventListener("click", closeIntro);
  $("#introStart").addEventListener("click", closeIntro);
  text($("#introHeading"), data.introLine || "For someone very special...");
  text($("#heroSubtitle"), data.heroMessage || "A little world I made, just for you.");
  text($("#signatureName"), data.yourName || "Your person");
  text($("#letterDisplayKicker"),`For you, ${data.girlfriendName || "Babi"}`);
  // The parchment displays a real, editable excerpt — not an empty heart.
  // Edits made in tools/personalize.html or config.js appear here automatically.
  const paperLines = toParagraphs(data.finalLetter).filter(Boolean);
  text($("#paperGreeting"), paperLines[0] || `My dearest ${data.girlfriendName || "Babi"},`);
  const excerpt = (paperLines[1] || paperLines[0] || `Every day with you is special, ${data.girlfriendName || "Babi"}.`).trim();
  text($("#paperExcerpt"), excerpt.length > 150 ? excerpt.slice(0, 147).trimEnd() + "…" : excerpt);
  text($("#paperSignoff"), `Always yours ♡`);

  $("#heroNote").addEventListener("click", () => showDialog({
    eyebrow: "BEFORE YOU BEGIN", title: `For you, ${data.girlfriendName || "Babi"} ♡`,
    paragraphs: [data.openingNote]
  }));
  $("#moonSecret").addEventListener("click", () => {
    showDialog({eyebrow:"YOU FOUND OUR SECRET MOON",title:`A wish for ${data.girlfriendName || "Babi"} ✧`,paragraphs:["They say the moon has watched over a million love stories. Tonight, it is watching over my favorite one: ours.",data.moonWish || "My wish is more wonderful days with you."]});
    if (!reduceMotion.matches) burstAt(window.innerWidth * .68, window.innerHeight * .2, 16);
  });

  // Relationship counter: deliberately does not fabricate an anniversary date.
  function updateCounter() {
    const dateString = data.anniversaryDate;
    const output = $("#counterValue");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) {
      text(output, "Every moment with you ♡"); return;
    }
    const start = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(start.getTime()) || start > new Date()) {
      text(output, "Our best days are ahead ♡"); return;
    }
    const days = Math.floor((Date.now() - start.getTime()) / 86400000);
    text(output, `${days.toLocaleString()} ${days === 1 ? "day" : "days"} of loving you ♡`);
  }
  updateCounter();
  window.setInterval(updateCounter, 60 * 60 * 1000);

  // Memory timeline. Add real images with filenames in config.js; placeholders
  // use the site's bundled artwork, so the page still looks complete.
  const timeline = $("#timeline");
  (data.memories || []).slice(0,8).forEach((memory, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-card reveal";
    button.setAttribute("aria-label", `Open memory: ${memory.title}`);
    const photo = document.createElement("div");
    photo.className = "memory-photo";
    const img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    const realPhoto = photoPath(memory.image,'memories');
    img.src = realPhoto || backgrounds[index % backgrounds.length];
    img.alt = realPhoto ? `Photo of ${memory.title}` : "Dreamy illustration, replace with your own photo";
    if (realPhoto) img.addEventListener("error", () => { img.src = backgrounds[index % backgrounds.length]; }, {once:true});
    img.style.objectPosition = ["center", "75% center", "center 55%", "60% center"][index % 4];
    photo.append(img);
    if (!realPhoto) photo.append(itemWithText("span", "Your photo here ♡", "photo-empty-tag"));
    button.append(photo, itemWithText("span", memory.date || `MEMORY ${index+1}`, "memory-index"), itemWithText("span", memory.title || "A Special Day", "memory-title"));
    const hint = itemWithText("span", "Read this memory  ↗", "memory-hint");
    button.append(hint);
    button.addEventListener("click", () => showDialog({
      eyebrow: memory.date || `MEMORY ${index+1}`,
      title: memory.title,
      paragraphs: toParagraphs(memory.message),
      photo: realPhoto,
      images: (memory.extraImages||[]).map(name=>photoPath(name,'memories')).filter(Boolean),
      caption: memory.caption || "",
      signoff: "A page from our little scrapbook ♡"
    }));
    timeline.append(button);
  });

  // Each star can reveal a unique caption, reason, and an optional photo.
  const reasonText = $("#starMessage");
  const reasons = data.reasons || [];
  const starBonus=$("#starBonus");
  $$("[data-star]").forEach((button,index) => {
    button.addEventListener("click", () => {
      const raw = reasons[index % Math.max(reasons.length,1)] || "You make my world brighter.";
      const reason = typeof raw==='string' ? {title:'A little reason',message:raw} : raw;
      state.seenReasons.add(index);
      $$("[data-star]").forEach(star => star.classList.toggle("is-selected", star === button));
      reasonText.classList.add("show-reason");
      reasonText.replaceChildren(itemWithText("span", "✧", "constellation-symbol"));
      if (photoPath(reason.image,'reasons')) {
        const photo=document.createElement('img');photo.className='constellation-photo';photo.src=photoPath(reason.image,'reasons');photo.alt=reason.caption || 'Our photo';photo.addEventListener('error',()=>photo.remove(),{once:true});reasonText.append(photo);
      }
      if (reason.title) reasonText.append(itemWithText('span',reason.title,'star-reason-title'));
      reasonText.append(itemWithText("p",reason.message||'My Babi ♡'));
      reasonText.append(itemWithText("small", `${state.seenReasons.size} of 8 stars discovered ♡`));
      if(state.seenReasons.size >= 8) starBonus.hidden=false;
    });
  });
  starBonus.addEventListener('click',()=>showDialog({eyebrow:'ALL EIGHT STARS',title:'A little secret for Babi ✧',paragraphs:[data.allStarsSurprise||'You mean the world to me, Babi.'],signoff:'Every star led back to you ♡'}));

  // Three DIFFERENT interactive mini gifts.
  $$("[data-gift]").forEach(button => {
    const index = Number(button.dataset.gift);
    const gift = (data.gifts||[])[index];
    if (!gift) {button.hidden=true;return;}
    text($(".gift-title",button),gift.title);
    const instruction=gift.type==='promiseJar'?'Draw a promise ↗':gift.type==='dateRoulette'?'Plan our date ↗':gift.type==='coupons'?'See your coupons ↗':'Tap to unwrap ↗';
    text($(".gift-action",button),instruction);
    button.addEventListener("click", () => {
      state.gifts.add(index);
      button.dataset.open = "true";
      const picture = $("img",button);
      picture.src = `${SPRITES}gift-opening.webp`;
      picture.alt = "An opened, glowing purple gift box";
      text($(".gift-action",button), "Open again ↗");
      text($("#unwrappedCaption"), `${state.gifts.size} of 3 surprises discovered ${state.gifts.size === 3 ? "— all yours, Babi! ♡" : "♡"}`);
      if (!reduceMotion.matches) {const rect=button.getBoundingClientRect();burstAt(rect.left+rect.width/2,rect.top+rect.height/2,14);}
      showDialog({eyebrow:`A SURPRISE FOR ${data.girlfriendName||'Babi'}`,title:gift.title,paragraphs:[],signoff:'Made just for you ♡'});
      addGiftExperience(gift,index);
    });
  });

  // "Open When" letters: each supports paragraphs, a personal photo and optional voice memo.
  const lettersGrid = $("#lettersGrid");
  (data.openWhen || []).forEach((letter,index) => {
    const button = document.createElement("button");button.type="button";
    button.className = "letter-card reveal mood-"+(index%4);
    button.setAttribute("aria-label",`Open letter: ${letter.title}`);
    const img=document.createElement('img');img.src=`${SPRITES}${index%2?'letter-bow':'letter-sealed'}.webp`;
    img.alt='Decorative pink romantic envelope';img.loading='lazy';
    button.append(img,itemWithText('span',`When ${letter.label.toLowerCase()}`,'letter-when'));
    const extras=[photoPath(letter.image,'letters')?'PHOTO':'',validAudio(letter.audio)?'VOICE NOTE':''].filter(Boolean);
    button.append(itemWithText('span',extras.length?extras.join(' · '):'A LETTER SEALED WITH LOVE','letter-detail'));
    button.append(itemWithText('span','Break the seal ↗','letter-tap'));
    button.addEventListener('click',()=>{
      showDialog({eyebrow:letter.stamp||'OPEN WHEN...',title:letter.title,paragraphs:toParagraphs(letter.message),photo:photoPath(letter.image,'letters'),audio:letter.audio||'',signoff:letter.signoff || `Always for you, ${data.yourName || 'your person'} ♡`});
      button.classList.add('has-opened');
    });
    lettersGrid.append(button);
  });

  $("#openFinalLetter").addEventListener("click", () => {
    showDialog({eyebrow:"MY HEART, IN WORDS",title:`Happy anniversary, ${data.girlfriendName || "Babi"}`,paragraphs:data.finalLetter || [],photo:photoPath(data.finalPhoto,'letters'),signoff:`Forever yours, ${data.yourName || "your person"} ♡`});
    if (!reduceMotion.matches) burstAt(window.innerWidth/2,window.innerHeight/2,22);
  });
  $("#replayStory").addEventListener("click", () => {
    if (dialog.open) dialog.close();
    window.scrollTo({top:0,behavior:reduceMotion.matches ? "instant" : "smooth"});
    pageBody.classList.add("intro-locked");
    intro.classList.remove("hidden");
    intro.removeAttribute("aria-hidden");
    window.setTimeout(() => $("#openIntro").focus({preventScroll:true}),reduceMotion.matches ? 0 : 500);
  });

  // Navigation, scroll progress and reveal animations.
  const header = $("#siteHeader");
  const nav = $("#mainNav");
  const menu = $("#menuToggle");
  function closeMenu() {nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-label","Open menu");}
  menu.addEventListener("click", () => {
    const opening = !nav.classList.contains("open");
    nav.classList.toggle("open",opening);
    menu.setAttribute("aria-expanded",String(opening));
    menu.setAttribute("aria-label",opening ? "Close menu" : "Open menu");
  });
  $$("a[href^='#']",nav).forEach(link => link.addEventListener("click",closeMenu));
  document.addEventListener("click", event => {if (!header.contains(event.target)) closeMenu();});
  document.addEventListener("keydown",event => {if (event.key === "Escape") closeMenu();});
  const progress = $("#siteProgress");
  let scrolling = false;
  function syncScroll() {
    header.classList.toggle("is-scrolled",window.scrollY > 30);
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${scrollable ? Math.min(100,Math.max(0,window.scrollY / scrollable * 100)) : 0}%`;
    scrolling = false;
  }
  window.addEventListener("scroll", () => { if(!scrolling){scrolling=true;requestAnimationFrame(syncScroll);} }, {passive:true});
  window.addEventListener("resize",syncScroll,{passive:true});
  syncScroll();
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const appear = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          appear.unobserve(entry.target);
        }
      });
    }, {threshold:.08,rootMargin:"0px 0px -20px 0px"});
    $$(".reveal").forEach(el => appear.observe(el));
    const activeNav = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        $$("a[href^='#']",nav).forEach(a => a.classList.toggle("active",a.hash === `#${entry.target.id}`));
      });
    }, {rootMargin:"-25% 0px -60% 0px",threshold:0});
    $$("main section[id]").forEach(section => activeNav.observe(section));
  } else $$(".reveal").forEach(el => el.classList.add("is-visible"));

  // Occasional falling SVG petals; limited nodes, paused for hidden pages.
  function makePetal() {
    if (reduceMotion.matches || document.hidden || pageBody.classList.contains("intro-locked")) return;
    if (window.innerWidth <= 430 && Math.random() < .5) return;
    const field = $("#petalField");
    if (field.children.length > 12) return;
    const petal = document.createElement("div");
    petal.className = "floating-petal";
    const image = document.createElement("img");
    image.src = "assets/images/decorations/petal.svg";
    image.alt = "";
    petal.append(image);
    petal.style.left = `${Math.random()*100}%`;
    petal.style.setProperty("--drift",`${Math.random()*160-80}px`);
    petal.style.setProperty("--twist",`${Math.random()*360+100}deg`);
    petal.style.animationDuration = `${9+Math.random()*6}s`;
    petal.style.width = `${10+Math.random()*13}px`;
    petal.addEventListener("animationend",() => petal.remove(),{once:true});
    field.append(petal);
  }
  if (!reduceMotion.matches) window.setInterval(makePetal,1500);
  function burstAt(x,y,amount=12) {
    const field = $("#heartBurst");
    const symbols = ["♡","♥","✦","✧"];
    for (let i=0;i<amount;i++) {
      const item = document.createElement("span");
      item.className = "burst-heart";
      item.textContent = symbols[i % symbols.length];
      item.style.left = `${x}px`;item.style.top = `${y}px`;
      item.style.color = ["#f7a3ba","#ffdcaa","#ffeff0"][i%3];
      item.style.setProperty("--x",`${(Math.random()-.5)*310}px`);
      item.style.setProperty("--y",`${-70-Math.random()*240}px`);
      item.style.setProperty("--r",`${(Math.random()-.5)*90}deg`);
      item.style.animationDelay = `${Math.random()*.18}s`;
      item.addEventListener("animationend",()=>item.remove(),{once:true});
      field.append(item);
    }
  }

  // Original, simple synthesized lullaby using Web Audio. No copyrighted audio
  // is included or automatically played. Starts only on an explicit button click.
  const musicToggle = $("#musicToggle");
  const melody = [392,440,523.25,659.25,587.33,523.25,440,392,349.23,392,440,523.25,440,392,349.23,329.63];
  function playTone(frequency) {
    if (!state.audio) return;
    const ctx = state.audio;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";osc.frequency.setValueAtTime(frequency,now);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(.023,now+.07);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.9);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);osc.stop(now+1);
  }
  function setMusicButton(playing){
    musicToggle.setAttribute("aria-pressed",String(playing));
    musicToggle.setAttribute("aria-label",playing?"Pause gentle background music":"Play gentle background music");
    musicToggle.title = playing?"Pause the original melody":"Play an original gentle melody";
    text($(".music-icon",musicToggle),playing?"♪":"♫");
  }
  async function setMusic(playing) {
    if (!playing) {
      if (state.audioTimer) clearInterval(state.audioTimer);
      state.audioTimer = null;state.music = false;
      if (state.audio) {await state.audio.close();state.audio=null;}
      setMusicButton(false);return;
    }
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType){showDialog({title:"Music isn't available",paragraphs:["Your browser doesn't support the audio feature. The rest of our little world will still work perfectly."]});return;}
    try {
      state.audio = new AudioContextType();
      await state.audio.resume();
      state.music = true;state.noteIndex=0;
      playTone(melody[state.noteIndex++]);
      state.audioTimer = window.setInterval(() => {
        if (!state.music || document.hidden) return;
        playTone(melody[state.noteIndex % melody.length]);state.noteIndex++;
      },820);
      setMusicButton(true);
    } catch(err){console.warn("Music unavailable",err);setMusicButton(false);}
  }
  musicToggle.addEventListener("click",() => {void setMusic(!state.music);});
  document.addEventListener("visibilitychange", () => {
    if (!state.audio || !state.music) return;
    if (document.hidden) {void state.audio.suspend();}
    else {void state.audio.resume();}
  });
})();
