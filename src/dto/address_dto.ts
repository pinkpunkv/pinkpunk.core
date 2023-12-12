class AddressFieldDto{
    type: string
    firstName: string
    lastName: string
    company: string
    street: string
    building: string
    apartment: string
    comment: string
    zipCode: string
    city: string
    country: string
    constructor(model: any) {
        this.type = model?.type || "shipping"
        this.firstName = model?.firstName || ""
        this.lastName = model?.lastName || ""
        this.company = model?.company || ""
        this.street = model?.street || ""
        this.building = model?.building || ""
        this.apartment = model?.apartment || ""
        this.comment = model?.comment || ""
        this.zipCode = model?.zipCode || ""
        this.city = model?.city || ""
        this.country = model?.country || ""
    }
}
class AddressDto{
    id: string
    userId: string
    mask: string
    fields: AddressFieldDto[]
    constructor(model: any) {
        this.id = model?.id || ""
        this.userId = model?.userId || ""
        this.mask = model?.mask || ""
        this.fields = model?.fields?model.fields.map((x:any)=>new AddressFieldDto(x)):[]
    }
}

export {AddressFieldDto, AddressDto}