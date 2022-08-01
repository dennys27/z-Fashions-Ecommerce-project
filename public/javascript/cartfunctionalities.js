 
     function changeQuantity(cartId, proId, count,dummy) {
       event.preventDefault();
       let quantity = parseInt(document.getElementById(proId).innerHTML);
       count = parseInt(count);
       $.ajax({
         url: "/change-product-quantity",
         data: {
           cart: cartId,
           product: proId,   
           count: count,
           quantity: quantity,
         },
         method: "post",
         success: (response) => {
           if (response.removeProduct) {
             alert("Product Removed from cart");
             location.reload();
           } else {
             document.getElementById(proId).innerHTML = quantity + count;
             document.getElementById("total").innerHTML = response.total;
           }
         },
       });
}
     


  //ADD TO CART
function addToCart(proId) {
  console.log("im working you know");
    
       $.ajax({
         url: "/add-to-cart/" + proId,
         method: "post",
         success: (response) =>{
           if (response.added) {
             let count = $("#cart-count").html();
             count = parseInt(count) + 1;
             $("#cart-count").html(count);
           } else {
             location.href="/login"
           }
         },
       });
}
     

function deleteProduct(cartId, proId) {
  console.log("im workinnnnggg");
       $.ajax({
         url: "/delete-cart-product",
         data: {
           cart: cartId,
           product: proId,
         },
         method: "post",
         success: (response) => {
           if (response.removed) {
             alert("Product Removed from cart");
             location.reload();
           }
         },
       });
}


//cancel order
     
function cancelOrder(orderId) {

  console.log("canell order ajax");
       $.ajax({
         url: "/user-cancel-order",
         data: {
           order:orderId
         },
         method: "post",
         success: (response) => {
           if (response.acknowledged) {
             alert("order cancelled");
             location.reload();
           }
         },
       });
     }