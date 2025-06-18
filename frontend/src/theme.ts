import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  },
  colors: {
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: 'lg',
          },
          _active: {
            bg: 'brand.700',
            transform: 'translateY(0)',
          },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
            borderColor: 'brand.600',
            color: 'brand.600',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'xl',
          boxShadow: 'lg',
          border: '1px solid',
          borderColor: 'gray.200',
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
      variants: {
        filled: {
          field: {
            bg: 'gray.50',
            _hover: {
              bg: 'gray.100',
            },
            _focus: {
              bg: 'white',
              borderColor: 'brand.500',
            },
          },
        },
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: '700',
        letterSpacing: '-0.025em',
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
})

export default theme 