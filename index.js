// ====== CONSTANTS ======
const ACC_KEY="vs_acc", LOGIN_KEY="vs_login", ORD_KEY="vs_orders";
let orders = JSON.parse(localStorage.getItem(ORD_KEY)) || [];
let currentUser = JSON.parse(localStorage.getItem(LOGIN_KEY)) || null;
let signupMode = false;

// Harga joki otomatis
const hargaMap = {
  Sea1: 7000, Sea2: 5000, Sea3: 3000,
  RaidNormal:1000, RaidAdvanced:3000, RaidAdvancedFW:12000,
  TrialGendong:5000, TrialJoki:10000
};

// ====== ADMIN DEFAULT ======
(function(){
  let acc = JSON.parse(localStorage.getItem(ACC_KEY)) || [];
  if(!acc.some(a=>a.user==="admin")){
    acc.push({user:"admin",pass:"12345",role:"admin"});
    localStorage.setItem(ACC_KEY,JSON.stringify(acc));
  }
})();

// ====== PASSWORD TOGGLE ======
function toggleInput(id){
  const el = document.getElementById(id);
  el.type = el.type==="password"?"text":"password";
}

// ====== LOGIN / SIGNUP ======
function enterSignupMode(){
  signupMode=true;
  document.getElementById("loginTitle").textContent="Sign Up";
  document.getElementById("confirmBox").classList.remove("hidden");
  document.getElementById("authBtn").textContent="Sign Up";
  const toggle = document.getElementById("toggleSignup");
  toggle.textContent="Sudah punya akun? Login";
  toggle.onclick=exitSignupMode;
}
function exitSignupMode(){
  signupMode=false;
  document.getElementById("loginTitle").textContent="Login";
  document.getElementById("confirmBox").classList.add("hidden");
  document.getElementById("authBtn").textContent="Login";
  const toggle = document.getElementById("toggleSignup");
  toggle.textContent="Belum punya akun? Sign Up";
  toggle.onclick=enterSignupMode;
}
function handleAuth(){
  const u=document.getElementById("loginUser").value.trim();
  const p=document.getElementById("loginPass").value;
  const c=document.getElementById("loginConfirm").value;
  if(!u || !p || (signupMode && !c)){ alert("Isi semua field!"); return; }

  let acc = JSON.parse(localStorage.getItem(ACC_KEY)) || [];

  if(signupMode){
    if(p!==c){ alert("Password tidak cocok!"); return; }
    if(acc.some(a=>a.user===u)){ alert("Username sudah dipakai!"); return; }
    acc.push({user:u,pass:p,role:"user"});
    localStorage.setItem(ACC_KEY,JSON.stringify(acc));
    alert("Akun berhasil dibuat!");
    exitSignupMode();
  } else {
    const f = acc.find(a=>a.user===u && a.pass===p);
    if(!f){ document.getElementById("loginError").style.display="block"; return; }
    currentUser=f;
    localStorage.setItem(LOGIN_KEY,JSON.stringify(f));
    showMain();
  }
}

// ====== MAIN / SIDEBAR ======
function showMain(){
  document.getElementById("loginPage").style.display="none";
  document.getElementById("mainPage").classList.remove("hidden");
  renderSidebar();
  showPage('home');
  renderOrders();
}

function logout(){
  localStorage.removeItem(LOGIN_KEY);
  location.reload();
}

function renderSidebar(){
  const sb=document.getElementById("mySidebar");
  sb.innerHTML='<a href="javascript:void(0)" onclick="closeNav()">✖ Tutup</a>';
  sb.innerHTML+='<a href="#" onclick="showPage(\'home\')">🏠 Home</a>';
  sb.innerHTML+='<a href="#" onclick="showPage(\'list\')">📋 List Joki</a>';
  sb.innerHTML+='<a href="#" onclick="showPage(\'order\')">🎮 Daftar Joki</a>';
  if(currentUser.role==="admin") sb.innerHTML+='<a href="#">🛠 Admin Panel</a>';
  sb.innerHTML+='<a href="#" onclick="logout()">🚪 Logout</a>';
}

function openNav(){document.getElementById("mySidebar").style.width="200px";document.getElementById("main").style.marginLeft="200px";}
function closeNav(){document.getElementById("mySidebar").style.width="0";document.getElementById("main").style.marginLeft="0";}
function showPage(p){
  document.querySelectorAll(".page").forEach(pg=>pg.style.display="none");
  document.getElementById(p).style.display="block";
  closeNav();
  if(p==="list") renderOrders();
}

// ====== ORDER JOKI ======
function updateHarga(){
  const sel = document.getElementById("jenisJoki").value;
  const harga = hargaMap[sel] || 0;
  document.getElementById("hargaJoki").textContent = harga ? "Harga: Rp " + harga.toLocaleString() : "";
}

// ====== AVATAR PREVIEW ======
async function updateAvatarPreview(){
  const username = document.getElementById("username").value.trim();
  const img = document.getElementById("avatarPreview");
  if(!username){ img.style.display="none"; return; }
  try{
    const res = await fetch(`https://api.roblox.com/users/get-by-username?username=${username}`);
    const data = await res.json();
    if(data && data.Id){
      img.src=`https://www.roblox.com/headshot-thumbnail/image?userId=${data.Id}&width=150&height=150&format=png`;
      img.style.display="inline-block";
    } else {
      img.style.display="none";
    }
  } catch(e){ img.style.display="none"; }
}

// ====== SUBMIT ORDER ======
document.getElementById("jokiForm").addEventListener("submit", function(e){
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const jenisJoki = document.getElementById("jenisJoki").value;
  const kebutuhan = document.getElementById("kebutuhan").value.trim();
  const pembayaran = document.getElementById("pembayaran").value;
  const bukti = document.getElementById("bukti").files[0];

  if(!username || !jenisJoki || !kebutuhan || !pembayaran || !bukti){
    alert("Isi semua field!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(){
    const buktiUrl = reader.result;
    const order = {username,password,jenisJoki,kebutuhan,pembayaran,buktiUrl,status:"Tahap"};
    orders.push(order);
    localStorage.setItem(ORD_KEY,JSON.stringify(orders));
    alert("Order berhasil dikirim!");
    document.getElementById("jokiForm").reset();
    document.getElementById("avatarPreview").style.display="none";
    renderOrders();
  };
  reader.readAsDataURL(bukti);
});

// ====== RENDER ORDERS ======
function renderOrders(){
  const listDiv=document.getElementById("orderList");
  listDiv.innerHTML="";
  if(orders.length===0){ document.getElementById("noOrders").textContent="Belum ada order"; return; }
  document.getElementById("noOrders").textContent="";
  orders.forEach(o=>{
    const div=document.createElement("div");
    div.className="order-item";
    const img=document.createElement("img");
    img.className="avatar";
    fetch(`https://api.roblox.com/users/get-by-username?username=${o.username}`)
      .then(res=>res.json())
      .then(data=>{ if(data && data.Id) img.src=`https://www.roblox.com/headshot-thumbnail/image?userId=${data.Id}&width=150&height=150&format=png`; });
    const info=document.createElement("div");
    info.innerHTML=`<b>${o.username}</b> - ${o.jenisJoki}<br>${o.kebutuhan}<br>Pembayaran: ${o.pembayaran}<br>Status: <span class="status ${o.status}">${o.status}</span>`;
    div.appendChild(img);
    div.appendChild(info);
    listDiv.appendChild(div);
  });
}

// ====== AUTO LOGIN ======
if(currentUser) showMain();