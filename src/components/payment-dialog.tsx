import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { countries } from '@/lib/countries'
import Image from 'next/image'

interface PaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  tier: 'hobbyist' | 'enthusiast'
  interval: 'monthly' | 'annual'
  productId: string
  userId: string
}

export default function PaymentDialog({
  isOpen,
  onClose,
  tier,
  interval,
  productId,
  userId
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryList, setShowCountryList] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    country: '',
    countryCode: '',
    postalCode: '',
  })
  const [postalCodeError, setPostalCodeError] = useState('')
  const [cityError, setCityError] = useState('')
  const [stateError, setStateError] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'postalCode') {
      // Only allow numbers
      if (value && !/^\d*$/.test(value)) {
        setPostalCodeError('Please enter numbers only')
        return
      }
      setPostalCodeError('')
    } else if (name === 'city' || name === 'state') {
      // Allow letters, spaces, hyphens, and apostrophes
      if (value && !/^[a-zA-Z\s\-']*$/.test(value)) {
        const errorMsg = 'Please enter letters only'
        if (name === 'city') {
          setCityError(errorMsg)
        } else {
          setStateError(errorMsg)
        }
        return
      }
      if (name === 'city') {
        setCityError('')
      } else {
        setStateError('')
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'country') {
      setCountrySearch(value)
      setShowCountryList(true)
    }
  }

  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  ).slice(0, 5)

  const selectCountry = (country: { code: string, name: string }) => {
    setFormData(prev => ({ ...prev, country: country.name, countryCode: country.code }))
    setCountrySearch(country.name)
    setShowCountryList(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all required fields
    const requiredFields = {
      name: 'Name',
      email: 'Email',
      street: 'Street Address',
      city: 'City',
      state: 'State/Province',
      country: 'Country',
      postalCode: 'Postal Code'
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key as keyof typeof formData])
      .map(([, label]) => label)

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please fill in the following fields: ${missingFields.join(', ')}`,
        variant: 'destructive'
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      // Validate postal code is a number
      const zipcode = parseInt(formData.postalCode, 10)
      if (isNaN(zipcode)) {
        throw new Error('Please enter a valid postal code (numbers only)')
      }
      console.log(productId);
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: formData.name,
            email: formData.email,
          },
          billing: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            country: formData.countryCode,
            zipcode
          },
          productId: productId,
          userId: userId
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setError(error.error || 'Payment initiation failed')
        setLoading(false)
        return
      }

      const { payment_url, subscription_id } = await response.json()
      
      // Store subscription ID in localStorage for tracking
      localStorage.setItem('pending_subscription_id', subscription_id)
      
      // Redirect to payment page
      window.location.href = payment_url
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-[450px] bg-gradient-to-b from-white to-blue-50">
        <DialogHeader className="space-y-2 pb-2">
          <div className="flex items-center justify-center">
            <Image
              src="/secure-payment.svg"
              alt="Secure Payment"
              width={48}
              height={48}
            />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-blue-600">
            Complete Your {tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription
          </DialogTitle>
          <p className="text-center text-sm text-gray-600">
            {interval === 'annual' ? 'Annual billing' : 'Monthly billing'} • Secure payment
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-4">
            <div className="border border-blue-100 rounded-lg p-3 bg-blue-50/50">
              <h3 className="font-medium text-sm text-blue-700 mb-2">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border border-blue-100 rounded-lg p-3 bg-blue-50/50">
              <h3 className="font-medium text-sm text-blue-700 mb-2">Billing Address</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="street" className="text-gray-700">Street Address</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="mt-1 h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" className="text-gray-700">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="mt-1 h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      placeholder="City"
                      required
                    />
                    {cityError && (
                      <p className="text-sm text-red-600 mt-1">{cityError}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-gray-700">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="mt-1 h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      placeholder="State"
                      required
                    />
                    {stateError && (
                      <p className="text-sm text-red-600 mt-1">{stateError}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {error && (
                    <div className="col-span-2 p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                      {error}
                    </div>
                  )}
                  <div className="relative">
                    <Label htmlFor="country" className="text-gray-700">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      onClick={() => setShowCountryList(true)}
                      className="mt-1 h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      placeholder="Select country"
                      required
                    />
                    {showCountryList && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-md shadow-lg max-h-48 overflow-auto">
                        {filteredCountries.map(country => (
                          <button
                            key={country.code}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                country: country.name,
                                countryCode: country.code
                              }))
                              setShowCountryList(false)
                            }}
                          >
                            {country.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode" className="text-gray-700">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="mt-1 h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      placeholder="Postal code"
                      required
                    />
                    {postalCodeError && (
                      <p className="text-sm text-red-600 mt-1">{postalCodeError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <Button
              type="submit"
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </div>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
