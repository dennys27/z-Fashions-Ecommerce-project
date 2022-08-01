
$("#check-out-form").submit((event) => {
    event.preventDefault()
    $.ajax({
        url: "/checkout-form",
        method: "post",
        data: $("#check-out-form").serialize(),
        success: ((response) => {
            if (response.status) {
                
                location.href="/cart"
                
            }
            alert("order placed successfully")
        })
    });
})

