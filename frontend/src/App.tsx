import { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Input,
  Button,
  Text,
  Container,
  useToast,
  Textarea,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Icon,
  Badge,
  Divider,
  useColorModeValue,
  Progress,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Tooltip,
  Link,
} from '@chakra-ui/react'
import ReactMarkdown from 'react-markdown'
import axios from 'axios'
import { 
  FiGithub, 
  FiSearch, 
  FiMessageSquare, 
  FiZap, 
  FiCode, 
  FiBookOpen,
  FiArrowRight,
  FiStar,
  FiUsers,
  FiDownload,
  FiPlay,
  FiCheckCircle,
  FiInfo
} from 'react-icons/fi'

const API_URL = 'http://localhost:8000'

function App() {
  const [repoUrl, setRepoUrl] = useState('')
  const [question, setQuestion] = useState('')
  const [summary, setSummary] = useState('')
  const [readme, setReadme] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const toast = useToast()

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  )
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const validateGitHubUrl = (url: string) => {
    if (!url) return false
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === 'github.com'
    } catch {
      return false
    }
  }

  const analyzeRepo = async () => {
    if (!repoUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a GitHub repository URL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!validateGitHubUrl(repoUrl)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsAnalyzing(true)
    setError(null)
    try {
      const response = await axios.post(`${API_URL}/analyze`, { url: repoUrl })
      setSummary(response.data.summary)
      setReadme(response.data.readme)
      setAnswer('')
      toast({
        title: 'Success!',
        description: 'Repository analyzed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      let errorMessage = 'Failed to analyze repository'
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.detail || errorMessage
      }
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
    setIsAnalyzing(false)
  }

  const askQuestion = async () => {
    if (!question || !repoUrl) {
      toast({
        title: 'Error',
        description: 'Please enter both a repository URL and a question',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!validateGitHubUrl(repoUrl)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsAsking(true)
    setError(null)
    try {
      const response = await axios.post(`${API_URL}/ask`, {
        question,
        repo_url: repoUrl,
      })
      setAnswer(response.data.answer)
      toast({
        title: 'Answer Generated!',
        description: 'Your question has been answered',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      let errorMessage = 'Failed to get answer'
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.detail || errorMessage
      }
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
    setIsAsking(false)
  }

  const features = [
    {
      icon: FiSearch,
      title: 'Smart Analysis',
      description: 'AI-powered repository analysis that understands your codebase structure and purpose.'
    },
    {
      icon: FiMessageSquare,
      title: 'Interactive Q&A',
      description: 'Ask questions about any part of the codebase and get intelligent, contextual answers.'
    },
    {
      icon: FiZap,
      title: 'Lightning Fast',
      description: 'Powered by Ollama and advanced embeddings for quick, accurate responses.'
    },
    {
      icon: FiCode,
      title: 'Multi-Language',
      description: 'Supports Python, JavaScript, TypeScript, Java, Go, C++, C, and Ruby repositories.'
    }
  ]

  const exampleRepos = [
    {
      name: 'React',
      url: 'https://github.com/facebook/react',
      description: 'Popular JavaScript library for building user interfaces'
    },
    {
      name: 'Vue.js',
      url: 'https://github.com/vuejs/vue',
      description: 'Progressive JavaScript framework for building UIs'
    },
    {
      name: 'FastAPI',
      url: 'https://github.com/tiangolo/fastapi',
      description: 'Modern Python web framework for building APIs'
    }
  ]

  const setExampleRepo = (url: string) => {
    setRepoUrl(url)
    toast({
      title: 'Example loaded!',
      description: 'Click "Analyze Repository" to get started',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      {/* Header */}
      <Box as="header" py={6} borderBottom="1px" borderColor={borderColor} bg={cardBg}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Icon as={FiGithub} w={8} h={8} color="blue.500" />
              <Heading size="lg" bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text">
                GitGenie
              </Heading>
            </HStack>
            <HStack spacing={4}>
              <Badge colorScheme="green" variant="subtle">AI-Powered</Badge>
              <Badge colorScheme="blue" variant="subtle">Free</Badge>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12}>
        {/* Hero Section */}
        <VStack spacing={12} textAlign="center" mb={16}>
          <VStack spacing={6} maxW="4xl">
            <Heading 
              size="2xl" 
              bgGradient="linear(to-r, blue.600, purple.600)" 
              bgClip="text"
              lineHeight="1.2"
            >
              Understand Any GitHub Repository
              <br />
              <Text as="span" fontSize="xl" color="gray.600">
                in Seconds
              </Text>
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              GitGenie uses advanced AI to analyze your codebase, answer questions, and provide insights 
              that help you understand complex repositories instantly.
            </Text>
            <HStack spacing={4} pt={4}>
              <Button
                size="lg"
                colorScheme="blue"
                leftIcon={<FiPlay />}
                onClick={() => document.getElementById('repo-input')?.focus()}
              >
                Try It Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                leftIcon={<FiBookOpen />}
              >
                View Examples
              </Button>
            </HStack>
          </VStack>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full" maxW="2xl">
            <Stat textAlign="center">
              <StatNumber color="blue.500">10+</StatNumber>
              <StatLabel>Languages Supported</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber color="purple.500">Instant</StatNumber>
              <StatLabel>Analysis Speed</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber color="green.500">100%</StatNumber>
              <StatLabel>Free to Use</StatLabel>
            </Stat>
          </SimpleGrid>
        </VStack>

        {/* Example Repositories */}
        <VStack spacing={6} mb={12}>
          <VStack spacing={2}>
            <Text fontSize="lg" color="gray.600">Try with popular repositories:</Text>
            <HStack spacing={4} flexWrap="wrap" justify="center">
              {exampleRepos.map((repo, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => setExampleRepo(repo.url)}
                  leftIcon={<FiStar />}
                >
                  {repo.name}
                </Button>
              ))}
            </HStack>
          </VStack>
        </VStack>

        {/* Main Interface */}
        <VStack spacing={8} align="stretch">
          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Repository Input */}
          <Card bg={cardBg} border="1px" borderColor={borderColor} borderRadius="xl" shadow="lg">
            <CardBody p={8}>
              <VStack spacing={6}>
                <HStack spacing={3}>
                  <Icon as={FiGithub} w={6} h={6} color="blue.500" />
                  <Heading size="md">Repository Analysis</Heading>
                </HStack>
                <VStack spacing={4} w="full">
                  <Input
                    id="repo-input"
                    size="lg"
                    placeholder="Enter GitHub repository URL (e.g., https://github.com/facebook/react)"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    borderColor={borderColor}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                  />
                  <Button
                    size="lg"
                    colorScheme="blue"
                    onClick={analyzeRepo}
                    isLoading={isAnalyzing}
                    loadingText="Analyzing Repository..."
                    leftIcon={<FiSearch />}
                    w="full"
                    h={12}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Repository'}
                  </Button>
                </VStack>
                {isAnalyzing && (
                  <VStack spacing={3} w="full">
                    <Progress size="sm" isIndeterminate colorScheme="blue" w="full" />
                    <Text fontSize="sm" color="gray.500">
                      Cloning repository and generating embeddings...
                    </Text>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Results Section */}
          {(summary || readme) && (
            <VStack spacing={6} align="stretch">
              {summary && (
                <Card bg={cardBg} border="1px" borderColor={borderColor} borderRadius="xl" shadow="lg">
                  <CardBody p={8}>
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={3}>
                        <Icon as={FiCheckCircle} w={5} h={5} color="green.500" />
                        <Heading size="md">Repository Summary</Heading>
                      </HStack>
                      <Box 
                        p={6} 
                        bg={useColorModeValue('gray.50', 'gray.700')} 
                        borderRadius="lg"
                        border="1px"
                        borderColor={borderColor}
                      >
                        <Text fontSize="md" lineHeight="1.7">{summary}</Text>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {readme && (
                <Card bg={cardBg} border="1px" borderColor={borderColor} borderRadius="xl" shadow="lg">
                  <CardBody p={8}>
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={3}>
                        <Icon as={FiBookOpen} w={5} h={5} color="purple.500" />
                        <Heading size="md">README Content</Heading>
                      </HStack>
                      <Box
                        p={6}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="lg"
                        maxH="500px"
                        overflowY="auto"
                        border="1px"
                        borderColor={borderColor}
                      >
                        <ReactMarkdown>{readme}</ReactMarkdown>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          )}

          {/* Question Section */}
          <Card bg={cardBg} border="1px" borderColor={borderColor} borderRadius="xl" shadow="lg">
            <CardBody p={8}>
              <VStack spacing={6}>
                <HStack spacing={3}>
                  <Icon as={FiMessageSquare} w={6} h={6} color="green.500" />
                  <Heading size="md">Ask Questions</Heading>
                </HStack>
                <VStack spacing={4} w="full">
                  <Textarea
                    size="lg"
                    placeholder="Ask a question about the repository (e.g., 'How does the authentication work?' or 'What are the main components?')"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={4}
                    borderColor={borderColor}
                    _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px var(--chakra-colors-green-500)' }}
                  />
                  <Button
                    size="lg"
                    colorScheme="green"
                    onClick={askQuestion}
                    isLoading={isAsking}
                    loadingText="Generating Answer..."
                    leftIcon={<FiMessageSquare />}
                    w="full"
                    h={12}
                    isDisabled={!summary}
                  >
                    {isAsking ? 'Thinking...' : 'Ask Question'}
                  </Button>
                </VStack>
                {isAsking && (
                  <VStack spacing={3} w="full">
                    <Progress size="sm" isIndeterminate colorScheme="green" w="full" />
                    <Text fontSize="sm" color="gray.500">
                      Analyzing code and generating answer...
                    </Text>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Answer Section */}
          {answer && (
            <Card bg={cardBg} border="1px" borderColor={borderColor} borderRadius="xl" shadow="lg">
              <CardBody p={8}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Icon as={FiZap} w={5} h={5} color="orange.500" />
                    <Heading size="md">Answer</Heading>
                  </HStack>
                  <Box 
                    p={6} 
                    bg={useColorModeValue('gray.50', 'gray.700')} 
                    borderRadius="lg"
                    border="1px"
                    borderColor={borderColor}
                  >
                    <Text fontSize="md" lineHeight="1.7">{answer}</Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>

        {/* Features Section */}
        <Box mt={20}>
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl" bgGradient="linear(to-r, blue.600, purple.600)" bgClip="text">
                Why Choose GitGenie?
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Powerful AI features designed to make code exploration effortless and insightful.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="full">
              {features.map((feature, index) => (
                <Card key={index} bg={cardBg} border="1px" borderColor={borderColor} borderRadius="xl" shadow="md" p={6}>
                  <VStack spacing={4} textAlign="center">
                    <Box p={3} bg="blue.100" borderRadius="full">
                      <Icon as={feature.icon} w={6} h={6} color="blue.600" />
                    </Box>
                    <Heading size="md">{feature.title}</Heading>
                    <Text fontSize="sm" color="gray.600">{feature.description}</Text>
                  </VStack>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>
      </Container>

      {/* Footer */}
      <Box as="footer" py={8} mt={20} borderTop="1px" borderColor={borderColor} bg={cardBg}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
            <HStack spacing={3}>
              <Icon as={FiGithub} w={6} h={6} color="blue.500" />
              <Text fontWeight="bold">GitGenie</Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              Powered by Ollama & Advanced AI • Made with ❤️ for developers
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}

export default App
