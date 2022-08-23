$(document).ready(function () {
  document.title = "Simple DataTable";
  $("#example").DataTable({
    dom: '<"dt-buttons"Bf><"clear">lirtp',
    paging: true,
    autoWidth: true,
    buttons: [
      "colvis",
      "copyHtml5",
      "csvHtml5",
      "excelHtml5",
      "pdfHtml5",
      "print",
    ],
  });
});


function changeOrderStatus(orderId,status) {
  console.log("changing order status");
  $.ajax({
    url: "/admin/change-order-status/" + orderId,
    method: "POST",
    data: {
      status: status,
    },

    success: (response) => {
      console.log("it worked");
    },
  });
}

//change order status dropdown
function changeOrderStatusAdmin(orderId,status) {
  console.log("changing order status");
  $.ajax({
    url: "/admin/change-order-status/" + orderId,
    method: "POST",
    data: {
      status: status,
    },

    success: (response) => {
      if (response) {
        location.reload();
     }
     
    },
  });
}


$("#specific-offer").submit((event) => {
  event.preventDefault();
  $.ajax({
    url: "/admin/specific-Offer",
    method: "post",
    data: $("#specific-offer").serialize(),
    success: (response) => {
      console.log(response);
      if (response.status) {
        swal("offer added successfully.")
      } else {
        swal("something went wrong.")
      }
    },
  });
});