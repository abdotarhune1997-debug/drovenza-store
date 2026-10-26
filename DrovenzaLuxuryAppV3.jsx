import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Store, ClipboardList, Search, Plus, Minus, Trash2, MessageCircle, Package, X } from 'lucide-react';
import { supabase } from './src/supabase.js';
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
  const [orderFilter, setOrderFilter] = useState('الكل');

  useEffect(() => { localStorage.setItem('drovenza_products_v1', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('drovenza_orders_v1', JSON.stringify(orders)); }, [orders]);
  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, category');
      if (error) {
        console.error('Supabase products error:', error);
        return;
      }
      if (active && data && data.length > 0) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category || 'أخرى',
          price: Number(p.price || 0),
          vendor: 'متجر',
          phone: '',
          stock: 1,
          image: p.image_url || '',
          description: p.description || ''
        })));
      }
    };
    loadProducts();
    return () => { active = false; };
  }, []);

  const categories = ['الكل', ...new Set(products.map(p => p.category).filter(Boolean))];
  const visibleProducts = useMemo(() => products.filter(p => (category === 'الكل' || p.category === category) && `${p.name} ${p.vendor} ${p.category}`.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  const cartItems = products.filter(p => cart[p.id] > 0).map(p => ({ ...p, qty: cart[p.id] }));
  const total = cartItems.reduce((sum, p) => sum + p.price * p.qty, 0);
  const setQty = (id, qty) => setCart(old => { const next = { ...old }; if (qty <= 0) delete next[id]; else next[id] = qty; return next; });
  const addProduct = e => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.vendor.trim() || Number(newProduct.price) <= 0) { setNotice('أدخل اسم المنتج واسم المتجر وسعرًا صحيحًا.'); return; }
    const p = { ...newProduct, id: `p${Date.now()}`, price: Number(newProduct.price), stock: Math.max(0, Number(newProduct.stock) || 0), image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' };
    setProducts(old => [p, ...old]); setNewProduct({ name: '', category: 'إكسسوارات', price: '', stock: '1', vendor: '', phone: '', image: '', description: '' }); setNotice('تمت إضافة المنتج إلى هذه النسخة التجريبية.'); setTab('products');
  };
  const placeOrder = e => {
    e.preventDefault();
    if (!cartItems.length) { setNotice('أضف منتجًا إلى السلة أولًا.'); return; }
    if (!checkout.name.trim() || !checkout.phone.trim() || !checkout.city.trim() || !checkout.address.trim()) { setNotice('أكمل الاسم ورقم الهاتف والمدينة والعنوان.'); return; }
    const order = { id: `DR-${Date.now().toString().slice(-8)}`, createdAt: new Date().toISOString(), customer: { ...checkout }, items: cartItems.map(({ id, name, price, vendor, phone, qty }) => ({ id, name, price, vendor, phone, qty })), total, status: 'جديد' };
    setOrders(old => [order, ...old]); setCart({}); setNotice(`تم تسجيل الطلب ${order.id} على هذا الجهاز. هذه نسخة تجريبية محلية وليست قاعدة بيانات مشتركة.`); setTab('orders');
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
      {[['products','المنتجات',ShoppingBag],['cart','السلة',ShoppingBag],['merchant','إضافة منتج للتاجر',Store],['orders','الطلبات',ClipboardList]].map(([id,label,Icon]) => <button key={id} onClick={() => { setTab(id); setNotice(''); }} style={{ ...btn(tab === id ? '#9b0050' : '#fff'), color: tab === id ? '#fff' : '#6d1745', border: '1px solid #eadde4' }}><Icon size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }}/>{label}{id === 'cart' && Object.values(cart).reduce((a,b)=>a+b,0) > 0 ? ` (${Object.values(cart).reduce((a,b)=>a+b,0)})` : ''}</button>)}
    </nav>
    {notice && <div role="status" style={{ background: '#fff1f7', border: '1px solid #f0bfd7', padding: 12, borderRadius: 10, marginBottom: 14 }}>{notice}<button aria-label="إغلاق" onClick={() => setNotice('')} style={{ float: 'left', border: 0, background: 'transparent' }}><X size={16}/></button></div>}

    {tab === 'products' && <section>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}><div style={{ position: 'relative', flex: '1 1 220px' }}><Search size={18} style={{ position: 'absolute', right: 12, top: 13, color: '#888' }}/><input aria-label="ابحث عن منتج" value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن منتج أو متجر..." style={{ ...inputStyle, paddingRight: 38 }}/></div><select aria-label="التصنيف" value={category} onChange={e=>setCategory(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 150 }}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>{visibleProducts.map(p=><article key={p.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px #0000000b', border: '1px solid #f0e9ed' }}><img src={p.image} alt={p.name} style={{ width: '100%', height: 190, objectFit: 'cover', background: '#eee' }} onError={e=>{e.currentTarget.style.display='none';}}/><div style={{ padding: 14 }}><h3 style={{ margin: '0 0 7px', fontSize: 17 }}>{p.name}</h3><p style={{ color: '#777', margin: '0 0 8px', fontSize: 13 }}>{p.vendor} · {p.category}</p><p style={{ margin: '0 0 8px', color: '#9b0050', fontSize: 20, fontWeight: 700 }}>{money(p.price)}</p><p style={{ fontSize: 13, color: '#666' }}>المتاح: {p.stock}</p><p style={{ fontSize: 13 }}>{p.description}</p><button disabled={p.stock <= 0} onClick={()=>{setQty(p.id,(cart[p.id]||0)+1);setNotice('أضيف المنتج إلى السلة.');}} style={{ ...btn(), width: '100%', opacity: p.stock <= 0 ? .5 : 1 }}>{p.stock <= 0 ? 'نفد المخزون' : 'أضف إلى السلة'}</button></div></article>)}</div>
      {!visibleProducts.length && <p>لا توجد منتجات تطابق بحثك.</p>}
    </section>}

    {tab === 'cart' && <section style={{ background: '#fff', borderRadius: 16, padding: 18 }}><h2>سلة المشتريات</h2>{!cartItems.length ? <p>السلة فارغة حاليًا. انتقل إلى المنتجات لإضافة ما تريد.</p> : <><div style={{ display: 'grid', gap: 12 }}>{cartItems.map(p=><div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottom: '1px solid #eee', paddingBottom: 10 }}><div style={{ flex: 1 }}><strong>{p.name}</strong><div>{money(p.price)} · {p.vendor}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button aria-label="زيادة الكمية" onClick={()=>setQty(p.id,Math.min(p.stock, p.qty+1))} style={btn('#eee')}><Plus size={15} color="#333"/></button><span>{p.qty}</span><button aria-label="تقليل الكمية" onClick={()=>setQty(p.id,p.qty-1)} style={btn('#eee')}><Minus size={15} color="#333"/></button><button aria-label="حذف المنتج" onClick={()=>setQty(p.id,0)} style={btn('#fff0f0')}><Trash2 size={15} color="#b00"/></button></div></div>)}</div><h3>الإجمالي: {money(total)}</h3><p style={{ color: '#666', fontSize: 13 }}>تكلفة التوصيل غير محسوبة؛ يتفق الزبون مع كل تاجر عليها.</p><form onSubmit={placeOrder} style={{ display: 'grid', gap: 10, maxWidth: 650 }}><h3>بيانات الزبون</h3><input required placeholder="الاسم الكامل" value={checkout.name} onChange={e=>setCheckout({...checkout,name:e.target.value})} style={inputStyle}/><input required placeholder="رقم الهاتف" inputMode="tel" value={checkout.phone} onChange={e=>setCheckout({...checkout,phone:e.target.value})} style={inputStyle}/><input required placeholder="المدينة" value={checkout.city} onChange={e=>setCheckout({...checkout,city:e.target.value})} style={inputStyle}/><input required placeholder="العنوان بالتفصيل" value={checkout.address} onChange={e=>setCheckout({...checkout,address:e.target.value})} style={inputStyle}/><textarea placeholder="ملاحظات (اختياري)" value={checkout.notes} onChange={e=>setCheckout({...checkout,notes:e.target.value})} style={inputStyle}/><button type="submit" style={btn()}>تأكيد الطلب</button></form></>}</section>}

    {tab === 'merchant' && <section style={{ background: '#fff', borderRadius: 16, padding: 18, maxWidth: 750 }}><h2><Store size={22} style={{ verticalAlign: 'middle', marginLeft: 8 }}/>إضافة منتج للتاجر</h2><p style={{ color: '#666' }}>أدخل بيانات المنتج لعرضه في هذه النسخة التجريبية. المنتجات لا تُنشر للعامة ولا تُشارك بين الأجهزة حتى نربط قاعدة بيانات وخدمة تسجيل دخول.</p><form onSubmit={addProduct} style={{ display: 'grid', gap: 11 }}><label>اسم المنتج<input required value={newProduct.name} onChange={e=>setNewProduct({...newProduct,name:e.target.value})} style={inputStyle}/></label><label>اسم المتجر / التاجر<input required value={newProduct.vendor} onChange={e=>setNewProduct({...newProduct,vendor:e.target.value})} style={inputStyle}/></label><label>رقم واتساب للتاجر مع مفتاح الدولة<input inputMode="tel" placeholder="مثال: 2189XXXXXXXX" value={newProduct.phone} onChange={e=>setNewProduct({...newProduct,phone:e.target.value})} style={inputStyle}/></label><label>التصنيف<select value={newProduct.category} onChange={e=>setNewProduct({...newProduct,category:e.target.value})} style={inputStyle}>{['إكسسوارات','هدايا','ملابس','عناية بالبشرة','إلكترونيات','منزل','أخرى'].map(c=><option key={c}>{c}</option>)}</select></label><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><label>السعر بالدينار<input required type="number" min="0.01" step="0.01" value={newProduct.price} onChange={e=>setNewProduct({...newProduct,price:e.target.value})} style={inputStyle}/></label><label>الكمية المتوفرة<input type="number" min="0" step="1" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct,stock:e.target.value})} style={inputStyle}/></label></div><label>رابط صورة المنتج (اختياري)<input type="url" value={newProduct.image} onChange={e=>setNewProduct({...newProduct,image:e.target.value})} style={inputStyle}/></label><label>وصف المنتج<textarea value={newProduct.description} onChange={e=>setNewProduct({...newProduct,description:e.target.value})} style={inputStyle}/></label><button type="submit" style={btn()}>إضافة المنتج</button></form></section>}

    {tab === 'orders' && <section style={{ background: '#fff', borderRadius: 16, padding: 18 }}><h2><ClipboardList size={22} style={{ verticalAlign: 'middle', marginLeft: 8 }}/>الطلبات</h2><p style={{ color: '#666', fontSize: 13 }}>هذه الطلبات محفوظة محليًا في المتصفح الحالي لأغراض التجربة فقط.</p><select value={orderFilter} onChange={e=>setOrderFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 240, marginBottom: 14 }}>{['الكل','جديد','قيد التجهيز','خرج للتوصيل','مكتمل','ملغى'].map(s=><option key={s}>{s}</option>)}</select>{orders.filter(o=>orderFilter==='الكل'||o.status===orderFilter).length===0 ? <p>لا توجد طلبات هنا حتى الآن.</p> : <div style={{ display: 'grid', gap: 14 }}>{orders.filter(o=>orderFilter==='الكل'||o.status===orderFilter).map(o=><article key={o.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><h3 style={{ margin: 0 }}>طلب {o.id}</h3><strong>{money(o.total)}</strong></div><p>الزبون: {o.customer.name} · الهاتف: {o.customer.phone}</p><p>العنوان: {o.customer.city}، {o.customer.address}</p><ul>{o.items.map((i,index)=><li key={`${i.id}-${index}`}>{i.name} × {i.qty} — {money(i.price*i.qty)} · {i.vendor}</li>)}</ul><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><label>حالة الطلب <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} style={{ ...inputStyle, width: 'auto', marginRight: 6 }}>{['جديد','قيد التجهيز','خرج للتوصيل','مكتمل','ملغى'].map(s=><option key={s}>{s}</option>)}</select></label><button onClick={()=>whatsappOrder(o)} style={btn('#168a48')}><MessageCircle size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }}/>التواصل عبر واتساب</button><button onClick={()=>{navigator.clipboard?.writeText(o.id);setNotice(`رقم الطلب: ${o.id}`);}} style={btn('#555')}>نسخ رقم الطلب</button></div></article>)}</div>}</section>}
    <footer style={{ marginTop: 24, padding: 14, borderTop: '1px solid #eadde4', color: '#666', fontSize: 12, lineHeight: 1.7 }}><Package size={15} style={{ verticalAlign: 'middle', marginLeft: 5 }}/> إصدار تجريبي أولي. لا تدخل بيانات حساسة. قبل الإطلاق الحقيقي يجب إضافة قاعدة بيانات مشتركة، تسجيل دخول وصلاحيات للتجار، تحقق من الطلبات، وسياسة خصوصية ونسخ احتياطي.</footer>
  </main>;
}
