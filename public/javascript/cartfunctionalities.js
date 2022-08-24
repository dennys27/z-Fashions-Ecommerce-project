 
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
           console.log(response.productId);
          //  if (response.hitmin) {
          //    location.reload()
          //  } else { 
           
           if (response.removeProduct) {
             swal("Product Removed from cart");
             location.reload();
           } else {
             document.getElementById(proId).innerHTML = quantity + count;
             document.getElementsByClassName(proId).innerHTML = quantity + count;

             document.getElementById("total").innerHTML = response.total;
             if (response.discounted) {
               document.getElementById("secondPrice").innerHTML =
                 response.firstTotal;
             }
             

             console.log(response.subtotal);
             document.getElementById(`ID${response.productId}`).innerHTML = response.subtotal;
             if (response.discounted) {
               document.getElementById("discounted").innerHTML =
                 response.discounted;
             } else {
               
             }
             
             
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
       })
}
     

function deleteProduct(cartId, proId) {

  swal({
    title: "Are you sure?",
    text: "do you want to remove this product from your cart",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {

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
             location.reload();
           }
         },
       });
      swal("Poof! Product removed from your cart", {
        icon: "success",
      });
    } else {
      swal("Your product is safe in your cart");
    }
  });



  //      $.ajax({
  //        url: "/delete-cart-product",
  //        data: {
  //          cart: cartId,
  //          product: proId,
  //        },
  //        method: "post",
  //        success: (response) => {
  //          if (response.removed) {
  //            swal("Good job!", "Product removed", "success");
  //            location.reload();
  //          }
  //        },
  //      });
}


//cancel order
     
function cancelOrder(orderId) {

  swal({
    title: "Are you sure?",
    text: "Do you want to cance the order",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
      swal("Order cancelled successfully", {
        icon: "success",
      })
      
      console.log("canell order ajax");
      $.ajax({
        url: "/user-cancel-order",
        data: {
          order: orderId,
        },
        method: "post",
        success: (response) => {
          if (response.acknowledged) {
            location.reload();
          }
        },
      });
        
    } else {
      // swal("");
    }
  });

  
     }

 
 function deleteCoupon(userId) {
       console.log("im working you know");

       $.ajax({
         url: "/delete-coupon-cart/" + userId,
         method: "post",
         success: (response) => {
           if (response.deleted) {
             document.getElementById("c-deleted").style.display="none;"
             swal("coupon removed from cart");
             location.reload()
           }
         },
       });
     }