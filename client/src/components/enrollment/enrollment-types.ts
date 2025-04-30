export interface Program {
  _id: string
  name: string
  description: string
  price: number
  googleClassroomLink?: string
  estimatedDuration: number
  offering: {
    _id: string
    name: string
    description: string
  }
  modules: Array<{
    _id: string
    name: string
    description: string
    estimatedDuration: number
  }>
}

export interface FormData {
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPassword: string
  parentConfirmPassword: string
  parentPhone: string
  parentAddress: string
  parentCity: string
  parentZip: string
  parentState: string
  parentCountry: string
  childFirstName: string
  childLastName: string
  childDOB: string
  childEmail: string
  childPassword: string
  childConfirmPassword: string
  childPhone: string
  childAddress: string
  childCity: string
  childZip: string
  childState: string
  childCountry: string
  paymentMethod: string
  cardNumber?: string
  cardExpiry?: string
  cardCVC?: string
  enrollmentDate: Date | undefined
}
