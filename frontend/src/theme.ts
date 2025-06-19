import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
    disableTransitionOnChange: false,
  },
  fonts: {
    heading: `'Inter', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
    body: `'Inter', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
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
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    blue: {
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
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    orange: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: 'linear-gradient(135deg, #181c2b 0%, #232946 50%, #181c2b 100%)',
        color: 'gray.100',
        minHeight: '100vh',
        backgroundAttachment: 'fixed',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.18) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.18) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.12) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: -1,
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'#ffffff\' fill-opacity=\'0.02\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          pointerEvents: 'none',
          zIndex: -1,
        },
      },
      '@keyframes gradientShift': {
        '0%': {
          backgroundPosition: '0% 50%',
        },
        '50%': {
          backgroundPosition: '100% 50%',
        },
        '100%': {
          backgroundPosition: '0% 50%',
        },
      },
      '@keyframes float': {
        '0%, 100%': {
          transform: 'translateY(0px)',
        },
        '50%': {
          transform: 'translateY(-10px)',
        },
      },
      'html, body': {
        scrollBehavior: 'smooth',
      },
      '::selection': {
        bg: 'blue.600',
        color: 'white',
      },
      '::-webkit-scrollbar': {
        width: '8px',
      },
      '::-webkit-scrollbar-track': {
        bg: 'gray.800',
      },
      '::-webkit-scrollbar-thumb': {
        bg: 'gray.600',
        borderRadius: '4px',
      },
      '::-webkit-scrollbar-thumb:hover': {
        bg: 'gray.500',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
      variants: {
        solid: {
          bg: 'blue.500',
          color: 'white',
          _hover: {
            bg: 'blue.600',
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
          },
          _active: {
            bg: 'blue.700',
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        outline: {
          borderColor: 'blue.400',
          color: 'blue.400',
          _hover: {
            bg: 'blue.900',
            borderColor: 'blue.300',
            color: 'blue.300',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s',
        },
        ghost: {
          _hover: {
            bg: 'blue.900',
          },
          transition: 'all 0.2s',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'rgba(24, 28, 43, 0.7)',
          borderRadius: '2xl',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          border: '1.5px solid',
          borderColor: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(16px)',
          _hover: {
            transform: 'translateY(-4px) scale(1.01)',
            boxShadow: '0 20px 40px 0 rgba(31, 38, 135, 0.25)',
            borderColor: 'rgba(255,255,255,0.18)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'rgba(24, 28, 43, 0.85)',
          borderRadius: '2xl',
          border: '1.5px solid',
          borderColor: 'rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          backdropFilter: 'blur(18px)',
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'blue.400',
      },
      variants: {
        filled: {
          field: {
            bg: 'rgba(31, 38, 56, 0.7)',
            borderColor: 'rgba(255,255,255,0.10)',
            color: 'gray.100',
            _hover: {
              bg: 'rgba(31, 38, 56, 0.85)',
            },
            _focus: {
              bg: 'rgba(31, 38, 56, 0.95)',
              borderColor: 'blue.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
            },
          },
        },
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'blue.400',
      },
      variants: {
        filled: {
          bg: 'rgba(31, 38, 56, 0.7)',
          borderColor: 'rgba(255,255,255,0.10)',
          color: 'gray.100',
          _hover: {
            bg: 'rgba(31, 38, 56, 0.85)',
          },
          _focus: {
            bg: 'rgba(31, 38, 56, 0.95)',
            borderColor: 'blue.400',
            boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: '800',
        letterSpacing: '-0.035em',
        lineHeight: '1.1',
      },
      sizes: {
        '2xl': {
          fontSize: ['2.5rem', '3.5rem'],
        },
        xl: {
          fontSize: ['2rem', '2.5rem'],
        },
        lg: {
          fontSize: ['1.5rem', '2rem'],
        },
      },
    },
    Badge: {
      variants: {
        solid: {
          bg: 'blue.400',
          color: 'gray.900',
        },
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            _selected: {
              bg: 'blue.400',
              color: 'gray.900',
              borderColor: 'blue.400',
            },
          },
        },
      },
    },
  },
})

export default theme 