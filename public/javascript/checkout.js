

$("#check-out-form").submit((event) => {
  event.preventDefault();
  $.ajax({
    url: "/checkout-form",
    method: "post",
    data: $("#check-out-form").serialize(),
    success: (response) => {
      console.log(response);
      if (response.walletPayment) {
       location.href = "/orders-list";
      } else if (response.codSuccess) {
        location.href = "/orders-list";
      } else if (response.razorpay == true) {
        razorpayPayment(response);
      } else if (response.payer.payment_method == "paypal") {
        for (let i = 0; i < response.links.length; i++) {
          if (response.links[i].rel === "approval_url") {
            location.href = response.links[i].href;
          }
        }
      } else if (response.order) {
        swal("order placed successfully");
        location.href = "/orders-list";
      } else if (response.cempty) {
        swal("Here's the title!", "your cart is empty");
        location.href = "/cart";
      }
     
    },
  });
});

$("#Default-Address").submit(async(event) => {
  let method = await document.getElementById("payment").value;
  let wallet = await document.getElementById("walletCheck");
  let walletStatus = wallet.checked;
  console.log(wallet.checked);
  event.preventDefault();
  $.ajax({
    url: "/checkout-form",
    method: "post",
    data:
      $("#Default-Address").serialize() +
      "&" +
      `PaymentMethod=${method}` +
      "&" +
      `walletStatus=${walletStatus}`,

    success: async (response) => {
      //console.log(response);
      if (response.codSuccess) {
        location.href = "/orders-list";
      } else if (response.razorpay == true) {
        console.log(response);
        razorpayPayment(response);
      } else if (response.walletPayment) {
        console.log(response, "yyyaaaaaaaaaaayyyy");
        await swal("order placed successfully");
        location.href = "/orders-list";
      } else if (response.wallet == false) {
        await swal("insuficiet balance");
        //location.href = "/checkout";
      } else if (response.payer.payment_method == "paypal") {
        for (let i = 0; i < response.links.length; i++) {
          if (response.links[i].rel === "approval_url") {
            location.href = response.links[i].href;
          }
        }
      } else if (response.cempty) {
        swal("Here's the title!", "your cart is empty");
        location.href = "/cart";
      }
    },
  });
});

function razorpayPayment(order) {
 //console.log(order,".........&&&&&.........");
  var options = {
    key: "rzp_test_WusE7m4kbzt470",
    amount: "50000",
    currency: "INR",
    name: "z fashions",
    description: "Test Transaction",
    image: "https://example.com/your_logo",
    order_id: order.id,
    handler: function (response) {
      console.log(response);
     verifyPayment(response, order);
    },
    prefill: {
      name: "Gaurav Kumar",
      email: "gaurav.kumar@example.com",
      contact: "9999999999",
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#3399cc",
    },
  };

  var rzp1 = new Razorpay(options);
  rzp1.open();
}

function verifyPayment(payment, order) {
//console.log(payment,"payment ajax is workinggggg..............55668877");
  $.ajax({
    url: "/verify-payment",
    data: {
      payment,
      order,
    },
    method: "post",
    success: (response) => {
      console.log(response, ".........&&&&&.........");
      if (response.status) {
        location.href = "/orders-list";
      } else {
        alert("Payment failed");
      }
    },
  });
}
