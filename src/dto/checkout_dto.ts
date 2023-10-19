class CheckoutInfoDto{
    email: string
    phone: string
    firstName: string | null
    lastName: string | null
    comment: string | null

    constructor(model:any){
        this.email = model.email || ""
        this.phone = model.phone || ""
        this.firstName = model.firstName
        this.lastName = model.lastName
        this.comment = model.comment
    }
}

export {CheckoutInfoDto}