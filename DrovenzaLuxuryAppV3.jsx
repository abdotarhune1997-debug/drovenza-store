import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Store, ClipboardList, Search, Plus, Minus, Trash2, MessageCircle, Package, X } from 'lucide-react';
import { supabase } from './supabase.js';
const seedProducts = [
  { id: 'p1', name: 'طقم لؤلؤ أنيق', category: 'إكسسوارات', price: 38, vendor: 'متجر تجريبي', phone: '', stock: 8, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', description: 'إكسسوار أنيق للمناسبات.' },
  { id: 'p2', name: 'سيروم للعناية بالبشرة', category: 'عناية بالبشرة', price: 45, vendor: 'متجر تجريبي', phone: '', stock: 6, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', description: 'يرجى التحقق من المكونات والصلاحية قبل الشراء.' },
  { id: 'p3', name: 'علبة هدايا', category: 'هدايا', price: 26, vendor: 'متجر تجريبي', phone: '', stock: 10, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', description: 'علبة هدايا بتغليف أنيق.' },
];
const readSaved = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const money = n => `${Number(n || 0).toFixed(2).replace(/\.00$/, '')} د.ل`;
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '12px', border: '1px solid #ddd', borderRadius: 10, font: 'inherit', background: '#fff' };
const btn = (bg = '#9B0050') => ({ border: 0, borderRadius: 10, padding: '11px 14px', background: bg, color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' });

export default function DrovenzaLuxuryAppV3() {
  const [products, setProducts] = useState(() => readSaved('drovenza_products_v1', seedProducts));
  const [orders, setOrders] = useState(() => readSaved('drovenza_orders_v1', []));
  const [cart, setCart] = useState({});
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('الكل');
  const [notice, setNotice] = useState('');
  const [checkout, setCheckout] = useState({ name: '', phone: '', city: 'طرابلس', address: '', notes: '' });
  const [newProduct, setNewProduct] = useState({ name: '', category: 'إكسسوارات', price: '', stock: '1', vendor: '', phone: '', image: '', description: '' });
const [editingProductId, setEditingProductId] = useState(null);
const [orderFilter, setOrderFilter] = useState('الكل');
const [session, setSession] = useState(null);
const [sellerApplications, setSellerApplications] = useState([]);
const [isDrovenzaAdmin, setIsDrovenzaAdmin] = useState(false);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showSellerApplication, setShowSellerApplication] = useState(false);
const [sellerOwnerName, setSellerOwnerName] = useState('');
const [sellerStoreName, setSellerStoreName] = useState('');
const [sellerPhone, setSellerPhone] = useState('');
const [sellerDescription, setSellerDescription] = useState('');
const [sellerEmail, setSellerEmail] = useState('');
const [sellerApplicationNotice, setSellerApplicationNotice] = useState('');
const [sellerApplicationLoading, setSellerApplicationLoading] = useState(false);

const submitSellerApplication = async e => {
  e.preventDefault();

  if (
    !sellerOwnerName.trim() ||
    !sellerStoreName.trim() ||
    !sellerPhone.trim()
  ) {
    setSellerApplicationNotice('أكمل الاسم واسم المتجر ورقم الهاتف.');
    return;
  }

  setSellerApplicationLoading(true);
  setSellerApplicationNotice('جارٍ إرسال الطلب...');

  try {
  const { error } = await supabase
    .from('seller_applications')
    .insert({
      owner_name: sellerOwnerName.trim(),
      store_name: sellerStoreName.trim(),
      phone: sellerPhone.trim(),
      email: sellerEmail.trim().toLowerCase(),
      description: sellerDescription.trim() || null,
         status: 'pending'
      });

    if (error) throw error;

    setSellerApplicationNotice(
      'تم إرسال طلبك بنجاح، وسيتم مراجعة طلبك قبل تفعيل المتجر.'
    );

    setSellerOwnerName('');
    setSellerStoreName('');
    setSellerPhone('');
    setSellerDescription('');
    setSellerEmail('');
  } catch (error) {
    console.error('Seller application error:', error);
    setSellerApplicationNotice('تعذر إرسال الطلب. حاول مرة أخرى.');
  } finally {
    setSellerApplicationLoading(false);
  }
};

  useEffect(() => { localStorage.setItem('drovenza_products_v1', JSON.stringify(products)); }, [products]);
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, newSession) => {
      setSession(newSession);
    }
  );

  return () => listener.subscription.unsubscribe();
}, []);
  useEffect(() => { localStorage.setItem('drovenza_orders_v1', JSON.stringify(orders)); }, [orders]);
  
useEffect(() => {
  let active = true;

  const checkAdmin = async () => {
    if (!session?.user?.id) {
      setIsDrovenzaAdmin(false);
      return;
    }

    const { data, error } = await supabase
      .from('drovenza_admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (active) {
      setIsDrovenzaAdmin(
        !error &&
        !!data &&
        session.user.id === 'd2f596cd-f160-43a4-833e-1c598e2175d0'
      );
    }
  };

  checkAdmin();

  return () => {
    active = false;
  };
}, [session]);

  useEffect(() => {
    let active = true;

   const loadProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, seller_id, name, description, price, image_url, category, stock');

      if (error) {
        console.error('Supabase products error:', error);
        return;
      }

      if (!active || !data) return;

      const sellerIds = [...new Set(
        data.map(p => p.seller_id).filter(Boolean)
      )];

      let sellersById = {};

      if (sellerIds.length > 0) {
        const { data: sellersData, error: sellersError } = await supabase
          .from('sellers')
          .select('id, store_name, phone')
          .in('id', sellerIds);

        if (sellersError) {
          console.error('Supabase sellers error:', sellersError);
        } else {
          (sellersData || []).forEach(seller => {
            sellersById[seller.id] = seller;
          });
        }
      }

      if (!active) return;

      setProducts(data.map(p => {
        const seller = sellersById[p.seller_id];

        return {
          id: p.id,
sellerId: p.seller_id,
          name: p.name,
          category: p.category || 'أخرى',
          price: Number(p.price || 0),
          vendor: seller?.store_name || 'متجر',
          phone: seller?.phone || '',
          stock: Number(p.stock || 0),
          image: p.image_url || '',
          description: p.description || ''
        };
      }));
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, []);


  const categories = ['الكل', ...new Set(products.map(p => p.category).filter(Boolean))];
  const visibleProducts = useMemo(() => products.filter(p => (category === 'الكل' || p.category === category) && `${p.name} ${p.vendor} ${p.category}`.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  const cartItems = products.filter(p => cart[p.id] > 0).map(p => ({ ...p, qty: cart[p.id] }));
  const total = cartItems.reduce((sum, p) => sum + p.price * p.qty, 0);
  const setQty = (id, qty) => setCart(old => { const next = { ...old }; if (qty <= 0) delete next[id]; else next[id] = qty; return next; });
const reviewSellerApplication = async (applicationId, decision) => {
  const { error } = await supabase.rpc('review_seller_application', {
    p_application_id: applicationId,
    p_decision: decision
  });

  if (error) {
    console.error('Review seller application error:', error);
    setNotice('تعذر تنفيذ القرار. تأكد من تسجيل الدخول بحساب المدير.');
    return;
  }

  setNotice(decision === 'approved'
    ? 'تم قبول طلب التاجر بنجاح.'
    : 'تم رفض طلب التاجر.');

  await loadSellerApplications();
};

const loadSellerApplications = async () => {
  const { data, error } = await supabase.rpc('list_seller_applications');

  if (error) {
    console.error('Load seller applications error:', error);
    setNotice('تعذر تحميل طلبات التجار. تأكد من تسجيل الدخول بحساب المدير.');
    return;
  }

  setSellerApplications(data || []);
};


const handleLogin = async e => {
  e.preventDefault();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setNotice('تعذر تسجيل الدخول: ' + error.message);
    return;
  }

  const { data: adminData, error: adminError } = await supabase
    .from('drovenza_admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  setIsDrovenzaAdmin(!adminError && !!adminData && data.user.id === 'd2f596cd-f160-43a4-833e-1c598e2175d0');
  setPassword('');
  setNotice('تم تسجيل الدخول بنجاح.');
};

const addProduct = async e => {
  e.preventDefault();

  if (!session) {
    setNotice('يرجى تسجيل الدخول أولاً.');
    return;
  }

  
const productData = {
  seller_id: session.user.id,
  name: newProduct.name.trim(),
  category: newProduct.category,
  price: Number(newProduct.price),
  stock: Number(newProduct.stock || 0),
  image_url: newProduct.image.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  description: newProduct.description.trim()
};

const { data: savedProduct, error } = editingProductId
  ? await supabase
      .from('products')
      .update(productData)
      .eq('id', editingProductId)
      .eq('seller_id', session.user.id)
      .select('id, name, description, price, image_url, category, stock')
      .single()
  : await supabase
      .from('products')
      .insert([productData])
      .select('id, name, description, price, image_url, category, stock')
      .single();


  if (error) {
    console.error('Save product error:', error);
    setNotice('لم يُحفظ المنتج: ' + error.message);
    return;
  }

  const p = {
    id: savedProduct.id,
 sellerId: session.user.id,
    name: savedProduct.name,
    category: savedProduct.category || 'أخرى',
    price: Number(savedProduct.price),
    stock: Number(savedProduct.stock || 0),
    image: savedProduct.image_url || '',
    description: savedProduct.description || '',
    vendor: newProduct.vendor,
    phone: newProduct.phone
  };

  
setProducts(old => editingProductId
  ? old.map(item => item.id === editingProductId ? p : item)
  : [p, ...old]
);

  setNewProduct({
    name: '',
    category: 'إكسسوارات',
    price: '',
    stock: '1',
    vendor: '',
    phone: '',
    image: '',
    description: ''
  });
setEditingProductId(null);
  setNotice('تم حفظ المنتج بنجاح.');
  setTab('products');
};
   
  const deleteProduct = async product => {
    if (!session?.user?.id) {
      setNotice('يرجى تسجيل الدخول أولاً.');
      return;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('seller_id', session.user.id);

    if (error) {
      setNotice('تعذر حذف المنتج: ' + error.message);
      return;
    }

    setProducts(old => old.filter(p => p.id !== product.id));
    setNotice('تم حذف المنتج بنجاح.');
  }; 
  
  
const placeOrder = async e => {
  e.preventDefault();

  if (!cartItems.length) {
    setNotice('أضف منتجًا إلى السلة أولًا.');
    return;
  }

  if (
    !checkout.name.trim() ||
    !checkout.phone.trim() ||
    !checkout.city.trim() ||
    !checkout.address.trim()
  ) {
    setNotice('أكمل الاسم ورقم الهاتف والمدينة والعنوان.');
    return;
  }

  try {
    setNotice('جارٍ تسجيل الطلب...');

    const { data, error } = await supabase.rpc(
      'place_drovenza_order',
      {
        p_customer_name: checkout.name.trim(),
        p_customer_phone: checkout.phone.trim(),
        p_customer_city: checkout.city.trim(),
        p_customer_address: checkout.address.trim(),
        p_items: cartItems.map(item => ({
          id: item.id,
          qty: item.qty
        }))
      }
    );

    if (error) {
      console.error('Supabase order error:', error);
      setNotice('تعذر تسجيل الطلب. حاول مرة أخرى.');
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      setNotice('لم يصل تأكيد الطلب من قاعدة البيانات.');
      return;
    }

    const newOrders = data.map(order => ({
      id: order.order_number,
      dbId: order.id,
      createdAt: new Date().toISOString(),
      customer: { ...checkout },
      items: (order.items || []).map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        vendor: item.vendor,
        phone: item.phone || '',
        qty: Number(item.qty)
      })),
      total: Number(order.total),
      status: order.status || 'جديد'
    }));

    setOrders(old => [...newOrders, ...old]);
    setCart({});
    setNotice(
      `تم تسجيل الطلب بنجاح. رقم الطلب: ${
        newOrders.map(order => order.id).join('، ')
      }`
    );
    setTab('orders');
  } catch (err) {
    console.error('Place order error:', err);
    setNotice('حدث خطأ أثناء تسجيل الطلب. حاول مرة أخرى.');
  }
};

  const updateStatus = (id, status) => setOrders(old => old.map(o => o.id === id ? { ...o, status } : o));
  const whatsappOrder = order => {
    const phones = [...new Set(order.items.map(i => i.phone).filter(Boolean))];
    if (!phones.length) { setNotice('لم يضف التاجر رقم واتساب صحيحًا؛ يمكن نسخ رقم الطلب والتواصل يدويًا.'); return; }
    const text = `طلب من Drovenza رقم ${order.id}\nالزبون: ${order.customer.name}\nالهاتف: ${order.customer.phone}\nالمدينة: ${order.customer.city}\nالعنوان: ${order.customer.address}\n${order.items.map(i => `- ${i.name} × ${i.qty}: ${money(i.price * i.qty)} (التاجر: ${i.vendor})`).join('\n')}\nالإجمالي: ${money(order.total)}`;
    window.open(`https://wa.me/${phones[0].replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return <main dir="rtl" style={{ minHeight: '100vh', background: '#faf8f5', color: '#242124', fontFamily: 'Arial, sans-serif', padding: 16, maxWidth: 1100, margin: '0 auto' }}>
    <header style={{ background: 'linear-gradient(135deg,#e6007e,#790044)', color: 'white', borderRadius: 20, padding: 22, marginBottom: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><div><h1 style={{ margin: 0, fontSize: 28 }}>دروفينزا | Drovenza</h1><p style={{ marginBottom: 0 }}>سوق محلي للتجار والزبائن في ليبيا</p></div><span style={{ background: '#ffffff20', borderRadius: 10, padding: 10 }}>نسخة تجريبية</span></div>
    </header>
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {[['products','المنتجات',ShoppingBag],['cart','السلة',ShoppingBag],['merchant','إضافة منتج للتاجر',Store],['myproducts','منتجاتي',Package],['orders','الطلبات',ClipboardList]].map(([id,label,Icon]) => <button key={id} onClick={() => { setTab(id); setNotice(''); }} style={{ ...btn(tab === id ? '#9b0050' : '#fff'), color: tab === id ? '#fff' : '#6d1745', border: '1px solid #eadde4' }}><Icon size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }}/>{label}{id === 'cart' && Object.values(cart).reduce((a,b)=>a+b,0) > 0 ? ` (${Object.values(cart).reduce((a,b)=>a+b,0)})` : ''}</button>)}
    </nav>

<button
  type="button"
  onClick={() => {
    setTab('sellerApply');
    setShowSellerApplication(false);
    setNotice('');
  }}
  style={{ ...btn(), marginBottom: 16 }}
>
  انضم كتاجر إلى Drovenza
</button>

{isDrovenzaAdmin && (
  <button
    type="button"
    onClick={() => {
      setTab('sellerReviews');
      setNotice('');
      loadSellerApplications();
    }}
    style={{ ...btn(), marginBottom: 16, marginRight: 8 }}
  >
    مراجعة طلبات التجار
  </button>
)}

 {notice && <div role="status" style={{ background: '#fff1f7', border: '1px solid #f0bfd7', padding: 12, borderRadius: 10, marginBottom: 14 }}>{notice}<button aria-label="إغلاق" onClick={() => setNotice('')} style={{ float: 'left', border: 0, background: 'transparent' }}><X size={16}/></button></div>}

    {tab === 'products' && <section>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}><div style={{ position: 'relative', flex: '1 1 220px' }}><Search size={18} style={{ position: 'absolute', right: 12, top: 13, color: '#888' }}/><input aria-label="ابحث عن منتج" value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن منتج أو متجر..." style={{ ...inputStyle, paddingRight: 38 }}/></div><select aria-label="التصنيف" value={category} onChange={e=>setCategory(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 150 }}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>{visibleProducts.map(p=><article key={p.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px #0000000b', border: '1px solid #f0e9ed' }}><img src={p.image} alt={p.name} style={{ width: '100%', height: 190, objectFit: 'cover', background: '#eee' }} onError={e=>{e.currentTarget.style.display='none';}}/><div style={{ padding: 14 }}><h3 style={{ margin: '0 0 7px', fontSize: 17 }}>{p.name}</h3><p style={{ color: '#777', margin: '0 0 8px', fontSize: 13 }}>{p.vendor} · {p.category}</p><p style={{ margin: '0 0 8px', color: '#9b0050', fontSize: 20, fontWeight: 700 }}>{money(p.price)}</p><p style={{ fontSize: 13, color: '#666' }}>المتاح: {p.stock}</p><p style={{ fontSize: 13 }}>{p.description}</p><button disabled={p.stock <= 0} onClick={()=>{setQty(p.id,(cart[p.id]||0)+1);setNotice('أضيف المنتج إلى السلة.');}} style={{ ...btn(), width: '100%', opacity: p.stock <= 0 ? .5 : 1 }}>{p.stock <= 0 ? 'نفد المخزون' : 'أضف إلى السلة'}</button></div></article>)}</div>
      {!visibleProducts.length && <p>لا توجد منتجات تطابق بحثك.</p>}
    </section>}

    {tab === 'cart' && <section style={{ background: '#fff', borderRadius: 16, padding: 18 }}><h2>سلة المشتريات</h2>{!cartItems.length ? <p>السلة فارغة حاليًا. انتقل إلى المنتجات لإضافة ما تريد.</p> : <><div style={{ display: 'grid', gap: 12 }}>{cartItems.map(p=><div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottom: '1px solid #eee', paddingBottom: 10 }}><div style={{ flex: 1 }}><strong>{p.name}</strong><div>{money(p.price)} · {p.vendor}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button aria-label="زيادة الكمية" onClick={()=>setQty(p.id,Math.min(p.stock, p.qty+1))} style={btn('#eee')}><Plus size={15} color="#333"/></button><span>{p.qty}</span><button aria-label="تقليل الكمية" onClick={()=>setQty(p.id,p.qty-1)} style={btn('#eee')}><Minus size={15} color="#333"/></button><button aria-label="حذف المنتج" onClick={()=>setQty(p.id,0)} style={btn('#fff0f0')}><Trash2 size={15} color="#b00"/></button></div></div>)}</div><h3>الإجمالي: {money(total)}</h3><p style={{ color: '#666', fontSize: 13 }}>تكلفة التوصيل غير محسوبة؛ يتفق الزبون مع كل تاجر عليها.</p><form onSubmit={placeOrder} style={{ display: 'grid', gap: 10, maxWidth: 650 }}><h3>بيانات الزبون</h3><input required placeholder="الاسم الكامل" value={checkout.name} onChange={e=>setCheckout({...checkout,name:e.target.value})} style={inputStyle}/><input required placeholder="رقم الهاتف" inputMode="tel" value={checkout.phone} onChange={e=>setCheckout({...checkout,phone:e.target.value})} style={inputStyle}/><input required placeholder="المدينة" value={checkout.city} onChange={e=>setCheckout({...checkout,city:e.target.value})} style={inputStyle}/><input required placeholder="العنوان بالتفصيل" value={checkout.address} onChange={e=>setCheckout({...checkout,address:e.target.value})} style={inputStyle}/><textarea placeholder="ملاحظات (اختياري)" value={checkout.notes} onChange={e=>setCheckout({...checkout,notes:e.target.value})} style={inputStyle}/><button type="submit" style={btn()}>تأكيد الطلب</button></form></>}</section>}

{tab === 'merchant' && (session ?<section style={{ background: '#fff', borderRadius: 16, padding: 18, maxWidth: 750 }}><h2><Store size={22} style={{ verticalAlign: 'middle', marginLeft: 8 }}/>إضافة منتج للتاجر</h2><p style={{ color: '#666' }}>أدخل بيانات المنتج لعرضه في هذه النسخة التجريبية. المنتجات لا تُنشر للعامة ولا تُشارك بين الأجهزة حتى نربط قاعدة بيانات وخدمة تسجيل دخول.</p><form onSubmit={addProduct} style={{ display: 'grid', gap: 11 }}><label>اسم المنتج<input required value={newProduct.name} onChange={e=>setNewProduct({...newProduct,name:e.target.value})} style={inputStyle}/></label><label>اسم المتجر / التاجر<input required value={newProduct.vendor} onChange={e=>setNewProduct({...newProduct,vendor:e.target.value})} style={inputStyle}/></label><label>رقم واتساب للتاجر مع مفتاح الدولة<input inputMode="tel" placeholder="مثال: 2189XXXXXXXX" value={newProduct.phone} onChange={e=>setNewProduct({...newProduct,phone:e.target.value})} style={inputStyle}/></label><label>التصنيف<select value={newProduct.category} onChange={e=>setNewProduct({...newProduct,category:e.target.value})} style={inputStyle}>{['إكسسوارات','هدايا','ملابس','عناية بالبشرة','إلكترونيات','منزل','أخرى'].map(c=><option key={c}>{c}</option>)}</select></label><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><label>السعر بالدينار<input required type="number" min="0.01" step="0.01" value={newProduct.price} onChange={e=>setNewProduct({...newProduct,price:e.target.value})} style={inputStyle}/></label><label>الكمية المتوفرة<input type="number" min="0" step="1" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct,stock:e.target.value})} style={inputStyle}/></label></div><label>رابط صورة المنتج (اختياري)<input type="url" value={newProduct.image} onChange={e=>setNewProduct({...newProduct,image:e.target.value})} style={inputStyle}/></label><label>وصف المنتج<textarea value={newProduct.description} onChange={e=>setNewProduct({...newProduct,description:e.target.value})} style={inputStyle}/></label><button type="submit" style={btn()}>إضافة المنتج</button></form></section> : <section style={{ background: '#fff', borderRadius: 16, padding: 18, maxWidth: 450 }}><h2>تسجيل دخول التاجر</h2><form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}><label>البريد الإلكتروني<input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}/></label><button type="submit" style={btn()}>تسجيل الدخول
</button></form>
<button
  type="button"
  style={btn()}
  onClick={() => setShowSellerApplication(v => !v)}
>
  {showSellerApplication ? 'إغلاق نموذج التاجر' : 'انضم كتاجر إلى Drovenza'}
</button>

{showSellerApplication && (
  <form
    onSubmit={submitSellerApplication}
    style={{ display: 'grid', gap: 12, marginTop: 16 }}
  >
    <h3>طلب الانضمام كتاجر</h3>

    <label>
      اسم صاحب المتجر
      <input
        required
        value={sellerOwnerName}
        onChange={e => setSellerOwnerName(e.target.value)}
        style={inputStyle}
      />
    </label>

    <label>
      اسم المتجر
      <input
        required
        value={sellerStoreName}
        onChange={e => setSellerStoreName(e.target.value)}
        style={inputStyle}
      />
    </label>

    <label>
      رقم هاتف التاجر
      <input
  required
  type="tel"
  value={sellerPhone}
  onChange={e => setSellerPhone(e.target.value)}
  style={inputStyle}
/>
</label>

<label>
  البريد الإلكتروني
  <input
    required
    type="email"
    value={sellerEmail}
    onChange={e => setSellerEmail(e.target.value)}
    style={inputStyle}
  />
</label>

<label>
  وصف المتجر والمنتجات
  <textarea
    value={sellerDescription}
    onChange={e => setSellerDescription(e.target.value)}
    style={inputStyle}
  />
</label>

    {sellerApplicationNotice && (
      <p>{sellerApplicationNotice}</p>
    )}

    <button
      type="submit"
      disabled={sellerApplicationLoading}
      style={btn()}
    >
      {sellerApplicationLoading ? 'جارٍ الإرسال...' : 'إرسال طلب الانضمام'}
    </button>
  </form>
)}
</section>)}


 {tab === 'sellerApply' && (
  <section style={{ background: '#fff', borderRadius: 16, padding: 18, maxWidth: 750 }}>
    <h2>طلب الانضمام كتاجر</h2>
    <form onSubmit={submitSellerApplication} style={{ display: 'grid', gap: 12 }}>
      <label>اسم صاحب المتجر
        <input required value={sellerOwnerName} onChange={e => setSellerOwnerName(e.target.value)} />
      </label>
      <label>اسم المتجر
        <input required value={sellerStoreName} onChange={e => setSellerStoreName(e.target.value)} />
      </label>
      <label>رقم الهاتف
        <input required value={sellerPhone} onChange={e => setSellerPhone(e.target.value)} />
      </label>
      <label>وصف المتجر (اختياري)
        <textarea value={sellerDescription} onChange={e => setSellerDescription(e.target.value)} />
      </label>
      {sellerApplicationNotice && <p>{sellerApplicationNotice}</p>}
      <button type="submit" disabled={sellerApplicationLoading} style={btn()}>
        {sellerApplicationLoading ? 'جارٍ الإرسال...' : 'إرسال طلب الانضمام'}
      </button>
    </form>
  </section>
)}

{tab === 'sellerReviews' && (
  <section style={{ background: '#fff', borderRadius: 16, padding: 18 }}>
    <h2>مراجعة طلبات التجار</h2>

    <button type="button" onClick={loadSellerApplications} style={btn()}>
      تحميل الطلبات
    </button>

    {sellerApplications.length === 0 ? (
      <p>لا توجد طلبات معروضة. اضغط تحميل الطلبات.</p>
    ) : sellerApplications.map(app => (
      <article key={app.application_id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginTop: 12 }}>
        <h3>{app.store_name}</h3>
        <p>صاحب المتجر: {app.owner_name}</p>
        <p>الهاتف: {app.phone}</p>
        <p>الوصف: {app.description || 'لا يوجد'}</p>
        <p>الحالة: {app.status}</p>

        {app.status === 'pending' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => reviewSellerApplication(app.application_id, 'approved')} style={btn()}>
              قبول
            </button>
            <button type="button" onClick={() => reviewSellerApplication(app.application_id, 'rejected')} style={btn()}>
              رفض
            </button>
          </div>
        )}
      </article>
    ))}
  </section>
)}
  
{tab === 'myproducts' && <section style={{ background: '#fff', borderRadius: 16, padding: 18 }}>
  <h2><Package size={22} style={{ verticalAlign: 'middle', marginLeft: 8 }}/>منتجاتي</h2>
  {!session ? <p>سجّل الدخول بحساب التاجر لعرض منتجاتك.</p> : (
    <div style={{ display: 'grid', gap: 12 }}>
      {products.filter(p => p.sellerId === session.user.id).length === 0
        ? <p>لا توجد منتجات مرتبطة بحسابك حتى الآن.</p>
        : products.filter(p => p.sellerId === session.user.id).map(p => (
          <article key={p.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
            <h3>{p.name}</h3>
            
<p>السعر: {money(p.price)} · الكمية: {p.stock}</p>
<button onClick={() => {
  setEditingProductId(p.id);
  setNewProduct({
    name: p.name || '',
    category: p.category || 'إكسسوارات',
    price: String(p.price || ''),
    stock: String(p.stock || 0),
    vendor: p.vendor || '',
    phone: p.phone || '',
    image: p.image || '',
    description: p.description || ''
  });
  setTab('merchant');
}}>تعديل المنتج</button>
<button
  onClick={() => {
    if (window.confirm('هل تريد حذف هذا المنتج؟')) {
      deleteProduct(p);
    }
  }}
>
  حذف المنتج
</button>
          </article>
        ))
      }
    </div>
  )}
</section>}
 {tab === 'orders' && <section style={{ background: '#fff', borderRadius: 16, padding: 18 }}><h2><ClipboardList size={22} style={{ verticalAlign: 'middle', marginLeft: 8 }}/>الطلبات</h2><p style={{ color: '#666', fontSize: 13 }}>هذه الطلبات محفوظة محليًا في المتصفح الحالي لأغراض التجربة فقط.</p><select value={orderFilter} onChange={e=>setOrderFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 240, marginBottom: 14 }}>{['الكل','جديد','قيد التجهيز','خرج للتوصيل','مكتمل','ملغى'].map(s=><option key={s}>{s}</option>)}</select>{orders.filter(o=>orderFilter==='الكل'||o.status===orderFilter).length===0 ? <p>لا توجد طلبات هنا حتى الآن.</p> : <div style={{ display: 'grid', gap: 14 }}>{orders.filter(o=>orderFilter==='الكل'||o.status===orderFilter).map(o=><article key={o.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><h3 style={{ margin: 0 }}>طلب {o.id}</h3><strong>{money(o.total)}</strong></div><p>الزبون: {o.customer.name} · الهاتف: {o.customer.phone}</p><p>العنوان: {o.customer.city}، {o.customer.address}</p><ul>{o.items.map((i,index)=><li key={`${i.id}-${index}`}>{i.name} × {i.qty} — {money(i.price*i.qty)} · {i.vendor}</li>)}</ul><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><label>حالة الطلب <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} style={{ ...inputStyle, width: 'auto', marginRight: 6 }}>{['جديد','قيد التجهيز','خرج للتوصيل','مكتمل','ملغى'].map(s=><option key={s}>{s}</option>)}</select></label><button onClick={()=>whatsappOrder(o)} style={btn('#168a48')}><MessageCircle size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }}/>التواصل عبر واتساب</button><button onClick={()=>{navigator.clipboard?.writeText(o.id);setNotice(`رقم الطلب: ${o.id}`);}} style={btn('#555')}>نسخ رقم الطلب</button></div></article>)}</div>}</section>}
    <footer style={{ marginTop: 24, padding: 14, borderTop: '1px solid #eadde4', color: '#666', fontSize: 12, lineHeight: 1.7 }}><Package size={15} style={{ verticalAlign: 'middle', marginLeft: 5 }}/> إصدار تجريبي أولي. لا تدخل بيانات حساسة. قبل الإطلاق الحقيقي يجب إضافة قاعدة بيانات مشتركة، تسجيل دخول وصلاحيات للتجار، تحقق من الطلبات، وسياسة خصوصية ونسخ احتياطي.</footer>
  </main>;
}
