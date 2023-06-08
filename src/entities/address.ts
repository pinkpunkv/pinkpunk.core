class Address {
    id :string 
    userId: string
    mask: string
    fields: AddressField[]
    
    static fromRow(id :string, userId: string, mask: string){
        let addr = new Address();
        addr.id = id;
        addr.userId = userId;
        addr.mask = mask;
        return addr
    }
    static fromObject(obj:any){
        let addr = new Address();
        addr.id = obj['id'];
        addr.userId = obj['userId'];
        addr.mask = obj['mask'];
        return addr
    }
}
class AddressField{
    id :number     
    type: string
    addressId: string
    firstName: string
    lastName: string
    company: string
    streetNumber: string
    apartments: string
    zipCode: string
    city: string
    country: string

    static fromRow(id :number,    
                type: string,
                addressId: string,
                firstName: string,
                lastName: string,
                company: string,
                streetNumber: string,
                apartments: string,
                zipCode: string,
                city: string,
                country: string){

        let field = new AddressField();
        field.id=id,
        field.type=type
        field.addressId=addressId
        field.firstName=firstName
        field.lastName=lastName
        field.company=company
        field.streetNumber=streetNumber
        field.apartments=apartments
        field.zipCode=zipCode
        field.city=city
        field.country=country
        return field
    }

    static fromObject(obj:any){
        let addr = new AddressField();
        addr.id=obj['id']
        addr.type=obj['type']
        addr.addressId=obj['addressId']
        addr.firstName=obj['firstName']
        addr.lastName=obj['lastName']
        addr.company=obj['company']
        addr.streetNumber=obj['streetNumber']
        addr.apartments=obj['apartments']
        addr.zipCode=obj['zipCode']
        addr.city=obj['city']
        addr.country=obj['country']
        return addr
    }
}

export {Address,AddressField}  