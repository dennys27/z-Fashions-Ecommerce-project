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


