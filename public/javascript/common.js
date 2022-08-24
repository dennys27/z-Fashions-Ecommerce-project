function removeAddress(uId) {
    console.log(uId);
    
  $.ajax({
    url: "/delete-address",
    data: {
      uId
    },
    method: "post",
    success: (response) => {
      console.log(response);
      if (response.deleted) {
          swal("address deleted successfully")
          location.reload()
      } else {
        swal("something went wrong");
      }
    },
  });
}


function makeItDefault(uId,objectId) {
  $.ajax({
    url: "/make-default",
    data: {
      uId,
    },
    method: "post",
    success: (response) => {
      console.log(response);
      if (response.default) {
        swal("default address changed");
        location.reload();
      } else {
        swal("something went wrong");
      }
    },
  });
}


$("#add-coupons").submit((event) => {
  event.preventDefault();
  $.ajax({
    url: "/admin/add-coupons",
    method: "post",
    data: $("#add-coupons").serialize(),
    success: (response) => {
      console.log(response);
      if (response.warning) {
        swal("the offer should be in between 10% - 80%")
      } else {
         swal("updated successfully");
         location.href = "/admin/add-coupons";
      }
       
      
    },
  });
});


function deleteCoupons(uId) {
  
  swal({
    title: "Are you sure?",
    text: "Once deleted, you will not be able to recover this coupon!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
  $.ajax({
    url: "/admin/delete-coupons",
    data: {
      uId,
    },
    method: "post",
    success: (response) => {
      if (response.acknowledged) {
        swal("coupon deleted successfully");
        location.reload();
      } else {
        swal("something went wrong");
      }
    },
  });

    } else {
      swal("Your coupon is safe!");
    }
  });
}

$("#coupon-form").submit((event) => {
  event.preventDefault();
  $.ajax({
    url: "/apply-coupons",
    method: "post",
    data: $("#coupon-form").serialize(),
    success: async (response) => {
      if (response.lessAmount) {
        swal("you have purchase for minimum 1000 to apply coupons");
      }
      console.log(response);
      if (response.applied) {
        swal("you can't use more than one coupon in a purchase")
      } else if (response.Already) {
        swal("you can't use a coupon more than once");
      } 
       
      if (response.status) {
        swal("invalid coupon")
      }
      else if (response[0].cExist) {
        let total = document.getElementById("total").innerHTML;
        console.log(total);
        let discountPrice = total-(response[0].percentage * total) / 100;
        console.log(discountPrice);
        document.getElementById("total").innerHTML = discountPrice;
        document.getElementById("c-deleted").style.visibility = "visible";
        document.getElementById("c-off").innerHTML = response[0].percentage; 
        location.reload()
        await swal("coupon applied successfully");
       
        
      } 
    },
  });
});




$("#add-offer").submit((event) => {
  event.preventDefault();
  $.ajax({
    url: "/admin/add-category-offers",
    method: "post",
    data: $("#add-offer").serialize(),
    success: (response) => {
      console.log(response);
      if (response.warning) {
        swal("the offer should be in between 10% - 80%");
      } else {
        swal("updated successfully");
        location.href = "/admin/add-offers";
      }
    },
  });
});



function changeOffer(categoryId,offerId) {
   $.ajax({
     url: "/admin/apply-category-offer",
     method: "post",
     data: { categoryId, offerId },
     success: (response) => {
       console.log(response);
       if (response.warning) {
         swal("the offer should be in between 10% - 80%");
       } else {
         swal("updated successfully");
         location.href = "/admin/add-offers";
       }
     },
   });


}