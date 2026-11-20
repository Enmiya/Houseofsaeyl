// UI prototype only. Replace this temporary demo sign-in with EmDash authentication before production.
const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const productsPage = document.getElementById('productsPage');
const formPage = document.getElementById('formPage');
const productForm = document.getElementById('productForm');
const productList = document.getElementById('productList');
const emptyState = document.getElementById('emptyState');
let products = JSON.parse(localStorage.getItem('saeylDemoProducts') || 'null') || [
  {id:1,name:'Copper Vessels',price:0,status:'In stock',image:'../homepage/assets/images/copper-vessels.jpg',description:'House of Saeyl collection'}
];
let editingId = null;

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) { loginError.textContent = 'Enter your email and password.'; return; }
  // Prototype navigation only: this does NOT securely authenticate credentials.
  loginError.textContent = '';
  sessionStorage.setItem('saeylAdminPreview', 'true');
  showApp();
});
function showApp(){ loginView.classList.add('hidden'); appView.classList.remove('hidden'); renderProducts(); }
function showLogin(){ appView.classList.add('hidden'); loginView.classList.remove('hidden'); }
if(sessionStorage.getItem('saeylAdminPreview') === 'true') showApp();
document.getElementById('logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem('saeylAdminPreview');showLogin();});
document.getElementById('addProductBtn').addEventListener('click',()=>openForm());
document.getElementById('backBtn').addEventListener('click',showProducts);
document.getElementById('cancelBtn').addEventListener('click',showProducts);
function showProducts(){formPage.classList.add('hidden');productsPage.classList.remove('hidden');}
function openForm(product=null){editingId=product?product.id:null;productForm.reset();document.getElementById('formTitle').textContent=product?'Edit product':'Add product';if(product){document.getElementById('productName').value=product.name;document.getElementById('productPrice').value=product.price;document.getElementById('productStatus').value=product.status;document.getElementById('productImage').value=product.image.startsWith('http')?product.image:'';document.getElementById('productDescription').value=product.description||'';}productsPage.classList.add('hidden');formPage.classList.remove('hidden');}
productForm.addEventListener('submit',(event)=>{event.preventDefault();const item={id:editingId||Date.now(),name:document.getElementById('productName').value.trim(),price:Number(document.getElementById('productPrice').value),status:document.getElementById('productStatus').value,image:document.getElementById('productImage').value.trim(),description:document.getElementById('productDescription').value.trim()};if(editingId)products=products.map(p=>p.id===editingId?item:p);else products.push(item);localStorage.setItem('saeylDemoProducts',JSON.stringify(products));renderProducts();showProducts();});
function renderProducts(){productList.innerHTML='';document.getElementById('productCount').textContent=`${products.length} product${products.length===1?'':'s'}`;emptyState.classList.toggle('hidden',products.length>0);products.forEach(p=>{const row=document.createElement('div');row.className='product-row';const info=document.createElement('div');info.className='product-info';const img=document.createElement('img');img.className='thumb';img.src=p.image||'../homepage/assets/images/copper-vessels.jpg';img.alt='';img.onerror=()=>{img.style.visibility='hidden';};const name=document.createElement('span');name.className='product-name';name.textContent=p.name;info.append(img,name);const price=document.createElement('span');price.textContent=p.price?`₹${p.price.toLocaleString('en-IN')}`:'—';const status=document.createElement('span');status.className='status';status.textContent=p.status;const edit=document.createElement('button');edit.className='edit-btn';edit.textContent='Edit';edit.addEventListener('click',()=>openForm(p));row.append(info,price,status,edit);productList.append(row);});}
renderProducts();
