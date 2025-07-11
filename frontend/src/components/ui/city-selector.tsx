import React, { useState, useEffect } from 'react'
import { Input } from './input'
import { MapPin } from 'lucide-react'

interface CitySelectorProps {
  value: string
  onChange: (city: string) => void
  placeholder?: string
  disabled?: boolean
}

// Common cities from the system (from properties database)
const COMMON_CITIES = [
  'Abatiá',
  'Cambará', 
  'Carlópolis',
  'Conselheiro Mairinck',
  'Guapirama',
  'Ibaiti',
  'Jaboti',
  'Jacarezinho',
  'Japira',
  'Joaquim Távora',
  'Nova Fátima',
  'Nova Santa Bárbara',
  'Pinhalão',
  'Quatiguá',
  'Ribeirão Claro',
  'Ribeirão do Pinhal',
  'Santo Antônio da Platina',
  'São José da Boa Vista',
  'Siqueira Campos',
  'Tomazina',
  'Wenceslau Braz'
].sort()

const CitySelector: React.FC<CitySelectorProps> = ({
  value,
  onChange,
  placeholder = "Digite ou selecione a cidade",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredCities, setFilteredCities] = useState<string[]>(COMMON_CITIES)

  useEffect(() => {
    if (value) {
      const filtered = COMMON_CITIES.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredCities(filtered)
    } else {
      setFilteredCities(COMMON_CITIES)
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    onChange(inputValue)
    setIsOpen(inputValue.length > 0)
  }

  const handleCitySelect = (city: string) => {
    onChange(city)
    setIsOpen(false)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputBlur = () => {
    // Delay closing to allow click on options
    setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
        />
      </div>

      {isOpen && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredCities.slice(0, 10).map((city) => (
            <button
              key={city}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
              onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
              onClick={() => handleCitySelect(city)}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-sm">{city}</span>
              </div>
            </button>
          ))}
          
          {value && !filteredCities.includes(value) && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-t border-gray-200"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleCitySelect(value)}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 text-blue-500" />
                <span className="text-sm text-blue-600">
                  Usar "{value}" (cidade personalizada)
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      {isOpen && filteredCities.length === 0 && value && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-sm text-gray-500">
            Nenhuma cidade encontrada. Digite o nome da cidade.
          </div>
        </div>
      )}
    </div>
  )
}

export default CitySelector