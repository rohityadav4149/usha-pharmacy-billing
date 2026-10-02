let itemNo=0;

const today=new Date();
document.getElementById("invoiceDate").value=today.toISOString().slice(0,10);
document.getElementById("invoiceNo").value="INV-"+String(Date.now()).slice(-6);

function addItem(data={}){
  itemNo++;
  const tr=document.createElement("tr");
  tr.innerHTML=`
    <td class="sr">${itemNo}</td>
    <td><input class="item-name" value="${data.name||""}" placeholder="Medicine name"></td>
    <td><input class="hsn" value="${data.hsn||""}" placeholder="HSN"></td>
    <td><input class="qty" type="number" min="1" value="${data.qty||1}" oninput="calculate()"></td>
    <td><select class="unit" onchange="handleUnit(this)">
        <option value="NONE">NONE</option>
        <option value="BAGS (BAG)">BAGS (BAG)</option>
        <option value="BOTTLES (BTL)">BOTTLES (BTL)</option>
        <option value="BOX (BOX)" selected>BOX (BOX)</option>
        <option value="BUNDLES (BDL)">BUNDLES (BDL)</option>
        <option value="BUCKETS (BKT)">BUCKETS (BKT)</option>
        <option value="CANS (CAN)">CANS (CAN)</option>
        <option value="CARTONS (CTN)">CARTONS (CTN)</option>
        <option value="DOZENS (DOZ)">DOZENS (DOZ)</option>
        <option value="GRAMS (GMS)">GRAMS (GMS)</option>
        <option value="KILOGRAMS (KGS)">KILOGRAMS (KGS)</option>
        <option value="LITRES (LTR)">LITRES (LTR)</option>
        <option value="MILLILITRES (MLT)">MILLILITRES (MLT)</option>
        <option value="PACKS (PAC)">PACKS (PAC)</option>
        <option value="PIECES (PCS)">PIECES (PCS)</option>
        <option value="STRIPS (STR)">STRIPS (STR)</option>
        <option value="TABLETS (TAB)">TABLETS (TAB)</option>
        <option value="VIALS (VLS)">VIALS (VLS)</option>
        <option value="OTHER">Add New Unit</option>
      </select></td>
    <td><input class="rate" type="number" min="0" step="0.01" value="${data.rate||0}" oninput="calculate()"></td>
    <td>
      <select class="disc-rate" onchange="calculate()">
        <option value="0">₹ 0.00 (0%)</option>
        <option value="5">₹ — (5%)</option>
        <option value="10">₹ — (10%)</option>
        <option value="15">₹ — (15%)</option>
        <option value="20">₹ — (20%)</option>
        <option value="other">Other</option>
      </select>
    </td>
    <td>
      <select class="gst-rate" onchange="calculate()">
        <option value="none">NONE</option>
        <option value="0">GST@0%</option>
        <option value="igst0">IGST@0%</option>
        <option value="0.25">GST@0.25%</option>
        <option value="igst0.25">IGST@0.25%</option>
        <option value="5">GST@5%</option>
        <option value="igst5">IGST@5%</option>
        <option value="12">GST@12%</option>
        <option value="igst12">IGST@12%</option>
        <option value="18" selected>GST@18%</option>
        <option value="igst18">IGST@18%</option>
        <option value="28">GST@28%</option>
        <option value="igst28">IGST@28%</option>
        <option value="other">Other</option>
      </select>
    </td>
    <td class="amount">₹ 0.00</td>
    <td class="no-print"><button class="delete" onclick="removeItem(this)">X</button></td>`;
  document.getElementById("itemBody").appendChild(tr);
  if(data.unit){
    const unitSelect=tr.querySelector(".unit");
    const existing=[...unitSelect.options].find(o=>o.value===data.unit);
    if(existing) existing.selected=true;
  }
  calculate();
}

function handleUnit(select){
  if(select.value === "OTHER"){
    const custom = prompt("Enter New Unit:", "");
    if(custom && custom.trim()){
      const value = custom.trim();
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = true;
      select.insertBefore(option, select.lastElementChild);
    } else {
      select.value = "BOX (BOX)";
    }
  }
}

function removeItem(btn){btn.closest("tr").remove();renumber();calculate()}
function renumber(){
 document.querySelectorAll("#itemBody tr").forEach((r,i)=>r.querySelector(".sr").textContent=i+1);
 itemNo=document.querySelectorAll("#itemBody tr").length;
}

function getTaxRate(select){
  const value=select.value;
  if(value==="none") return 0;
  if(value==="other"){
    const custom=prompt("Enter GST percentage:", "18");
    const n=parseFloat(custom);
    return Number.isFinite(n)&&n>=0 ? n : 0;
  }
  return parseFloat(value.replace("igst","")) || 0;
}

function calculate(){
 let sub=0,disc=0,gst=0,qty=0;
 const taxMap={};

 document.querySelectorAll("#itemBody tr").forEach(r=>{
   const q=+r.querySelector(".qty").value||0;
   const rate=+r.querySelector(".rate").value||0;
   const gross=q*rate;

   const discSelect=r.querySelector(".disc-rate");
   let discRate=discSelect.value==="other" ? 0 : (+discSelect.value||0);
   const dAmt=gross*discRate/100;
   const taxable=Math.max(0,gross-dAmt);

   const gstSelect=r.querySelector(".gst-rate");
   const gr=getTaxRate(gstSelect);
   const tax=taxable*gr/100;
   const amount=taxable+tax;

   r.querySelector(".amount").textContent="₹ "+amount.toFixed(2);
   qty+=q; disc+=dAmt; gst+=tax; sub+=amount;

   // Show the calculated discount amount in the select's title.
   discSelect.title=`Discount: ₹ ${dAmt.toFixed(2)} (${discRate}%)`;
   gstSelect.title=`GST: ₹ ${tax.toFixed(2)} (${gr}%)`;

   const hsn=r.querySelector(".hsn").value||"-";
   if(!taxMap[hsn]) taxMap[hsn]={base:0,gst:0,rate:gr};
   taxMap[hsn].base+=taxable;
   taxMap[hsn].gst+=tax;
 });

 document.getElementById("totalQty").textContent=qty;
 document.getElementById("totalDiscount").textContent="₹ "+disc.toFixed(2);
 document.getElementById("totalGst").textContent="₹ "+gst.toFixed(2);
 document.getElementById("subtotal").textContent="₹ "+sub.toFixed(2);
 document.getElementById("subTotal2").textContent=sub.toFixed(2);

 const rounded=Math.round(sub);
 const ro=rounded-sub;
 document.getElementById("roundOff").textContent=(ro>=0?"+ ":"- ")+Math.abs(ro).toFixed(2);
 document.getElementById("grandTotal").textContent=rounded.toFixed(2);
 document.getElementById("amountWords").textContent=numberToWords(rounded)+" Rupees Only";

 const received=+document.getElementById("received").value||0;
 document.getElementById("balance").textContent=Math.max(0,rounded-received).toFixed(2);
 document.getElementById("saved").textContent=disc.toFixed(2);

 let rows="",taxableTotal=0,cgst=0,sgst=0,tax=0;
 Object.keys(taxMap).forEach(h=>{
   const x=taxMap[h], half=x.gst/2;
   taxableTotal+=x.base; cgst+=half; sgst+=half; tax+=x.gst;
   rows+=`<tr><td>${h}</td><td>${x.base.toFixed(2)}</td><td>${(x.rate/2).toFixed(2)}</td><td>${half.toFixed(2)}</td><td>${(x.rate/2).toFixed(2)}</td><td>${half.toFixed(2)}</td><td>${x.gst.toFixed(2)}</td></tr>`;
 });
 document.getElementById("taxRows").innerHTML=rows||'<tr><td>-</td><td>0.00</td><td>0</td><td>0.00</td><td>0</td><td>0.00</td><td>0.00</td></tr>';
 document.getElementById("taxableTotal").textContent=taxableTotal.toFixed(2);
 document.getElementById("cgstTotal").textContent=cgst.toFixed(2);
 document.getElementById("sgstTotal").textContent=sgst.toFixed(2);
 document.getElementById("taxTotal").textContent=tax.toFixed(2);
}

function newBill(){
 if(!confirm("Start a new bill?"))return;
 document.getElementById("itemBody").innerHTML="";
 itemNo=0;
 document.getElementById("invoiceNo").value="INV-"+String(Date.now()).slice(-6);
 document.getElementById("invoiceDate").value=new Date().toISOString().slice(0,10);
 document.getElementById("customerName").value="";
 document.getElementById("customerPhone").value="";
 document.getElementById("received").value=0;
 addItem();
}

function numberToWords(n){
 n=Math.floor(n);
 if(n===0)return"Zero";
 const ones=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
 const tens=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
 function two(x){return x<20?ones[x]:tens[Math.floor(x/10)]+(x%10?" "+ones[x%10]:"")}
 function three(x){return x>=100?ones[Math.floor(x/100)]+" Hundred"+(x%100?" "+two(x%100):""):two(x)}
 let s="";
 if(n>=10000000){s+=three(Math.floor(n/10000000))+" Crore ";n%=10000000}
 if(n>=100000){s+=three(Math.floor(n/100000))+" Lakh ";n%=100000}
 if(n>=1000){s+=three(Math.floor(n/1000))+" Thousand ";n%=1000}
 if(n>0)s+=three(n);
 return s.trim();
}

addItem({name:"",qty:1,unit:"Box",rate:0,disc:0,gst:0});
