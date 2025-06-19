import { useState, useRef } from 'react'
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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Avatar,
  Tag,
  TagLabel,
  TagLeftIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
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
  FiInfo,
  FiFile,
  FiFolder,
  FiCpu,
  FiDatabase,
  FiSettings,
  FiChevronDown,
  FiChevronRight,
  FiHash,
  FiTag,
  FiMoon,
  FiSun,
  FiExternalLink,
  FiGlobe,
  FiTrendingUp,
  FiShield,
  FiLayers,
  FiCommand,
  FiTerminal,
  FiGitBranch,
  FiGitCommit,
  FiGitPullRequest,
  FiAlertCircle,
  FiClock,
  FiActivity,
  FiBarChart,
  FiPieChart,
  FiGrid,
  FiList,
  FiMaximize2,
  FiMinimize2,
  FiX,
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface CodeStructure {
  imports?: string[];
  functions?: Array<{
    name: string;
    line: number;
    args: string[];
    docstring: string;
  }>;
  classes?: Array<{
    name: string;
    line: number;
    methods: Array<{
      name: string;
      line: number;
      args: string[];
      docstring: string;
    }>;
    docstring: string;
  }>;
  type?: string;
  size?: number;
  lines?: number;
  error?: string;
}

interface Stats {
  total_files: number;
  python_files: number;
  js_files: number;
  total_functions: number;
  total_classes: number;
}

interface AnalyzeResponse {
  summary: string;
  readme: string;
  code_structure: Record<string, CodeStructure>;
  stats: Stats;
}

interface QuestionResponse {
  answer: string;
  context_files: string[];
}

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
  const [codeStructure, setCodeStructure] = useState<Record<string, CodeStructure>>({})
  const [stats, setStats] = useState<Stats | null>(null)
  const [contextFiles, setContextFiles] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Dark mode color scheme
  const cardBg = 'gray.800'
  const borderColor = 'gray.700'
  const textColor = 'gray.100'
  const mutedTextColor = 'gray.400'
  const accentColor = 'blue.300'
  const successColor = 'green.300'
  const warningColor = 'orange.300'
  const errorColor = 'red.300'
  const codeBg = 'gray.700'
  const headerBg = 'gray.800'
  const headerBorder = 'gray.700'
  const headerShadow = 'lg'

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
      const response = await axios.post<AnalyzeResponse>(`${API_URL}/analyze`, { url: repoUrl })
      setSummary(response.data.summary)
      setReadme(response.data.readme)
      setCodeStructure(response.data.code_structure)
      setStats(response.data.stats)
      setAnswer('')
      setContextFiles([])
      setActiveTab(0)
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
      const response = await axios.post<QuestionResponse>(`${API_URL}/ask`, {
        question,
        repo_url: repoUrl,
      })
      setAnswer(response.data.answer)
      setContextFiles(response.data.context_files)
      setActiveTab(3) // Switch to Q&A tab
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

  // Example repositories
  const exampleRepos = [
    {
      name: 'React',
      description: 'The library for web and native user interfaces',
      url: 'https://github.com/facebook/react',
      stars: '210k+',
      language: 'JavaScript'
    },
    {
      name: 'Vue.js',
      description: 'The Progressive JavaScript Framework',
      url: 'https://github.com/vuejs/vue',
      stars: '205k+',
      language: 'JavaScript'
    },
    {
      name: 'FastAPI',
      description: 'Modern, fast web framework for building APIs',
      url: 'https://github.com/tiangolo/fastapi',
      stars: '70k+',
      language: 'Python'
    }
  ]

  // Features array
  const features = [
    {
      title: 'Smart Analysis',
      description: 'AI-powered code analysis that understands your codebase structure and patterns.',
      icon: FiCpu,
      color: 'blue'
    },
    {
      title: 'Instant Q&A',
      description: 'Ask questions about any part of the code and get intelligent, context-aware answers.',
      icon: FiMessageSquare,
      color: 'green'
    },
    {
      title: 'Multi-Language',
      description: 'Support for Python, JavaScript, TypeScript, Java, Go, C++, and many more languages.',
      icon: FiCode,
      color: 'purple'
    },
    {
      title: 'Fast & Free',
      description: 'Lightning-fast analysis with intelligent caching. Completely free to use.',
      icon: FiZap,
      color: 'orange'
    }
  ]

  const handleExampleSelect = (url: string) => {
    setRepoUrl(url);
    onClose();
    toast({
      title: 'Example loaded!',
      description: 'Click "Analyze Repository" to get started',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const renderCodeStructure = () => {
    const files = Object.entries(codeStructure)
    
    return (
      <Accordion allowMultiple>
        {files.slice(0, 20).map(([filePath, structure]) => (
          <AccordionItem key={filePath} border="none" mb={2}>
            <AccordionButton
              bg="gray.700"
              _hover={{ bg: 'gray.600' }}
              borderRadius="lg"
              p={4}
            >
              <Box flex="1" textAlign="left">
                <HStack>
                  <Icon as={FiFile} color={accentColor} />
                  <Text fontWeight="medium" color={textColor}>{filePath}</Text>
                  {structure.functions && (
                    <Badge colorScheme="green" size="sm" variant="subtle">
                      {structure.functions.length} func
                    </Badge>
                  )}
                  {structure.classes && (
                    <Badge colorScheme="purple" size="sm" variant="subtle">
                      {structure.classes.length} class
                    </Badge>
                  )}
                </HStack>
              </Box>
              <AccordionIcon color={mutedTextColor} />
            </AccordionButton>
            <AccordionPanel pb={4} pt={2}>
              <VStack align="stretch" spacing={3}>
                {structure.functions && structure.functions.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2} color={textColor}>Functions:</Text>
                    <List spacing={1}>
                      {structure.functions.slice(0, 5).map((func, idx) => (
                        <ListItem key={idx}>
                          <HStack>
                            <ListIcon as={FiHash} color={successColor} />
                            <Code fontSize="sm" bg="gray.700" color={textColor}>
                              {func.name}({func.args.join(', ')})
                            </Code>
                            <Text fontSize="xs" color={mutedTextColor}>line {func.line}</Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {structure.classes && structure.classes.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2} color={textColor}>Classes:</Text>
                    <List spacing={1}>
                      {structure.classes.slice(0, 3).map((cls, idx) => (
                        <ListItem key={idx}>
                          <HStack>
                            <ListIcon as={FiTag} color={warningColor} />
                            <Code fontSize="sm" bg="gray.700" color={textColor}>
                              {cls.name}
                            </Code>
                            <Text fontSize="xs" color={mutedTextColor}>line {cls.line}</Text>
                            {cls.methods && cls.methods.length > 0 && (
                              <Badge size="sm" colorScheme="blue" variant="subtle">
                                {cls.methods.length} methods
                              </Badge>
                            )}
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    )
  }

  return (
    <Box minH="100vh" color={textColor} position="relative" overflow="hidden">
      {/* Floating Background Elements */}
      <Box
        position="fixed"
        top="10%"
        left="5%"
        w="200px"
        h="200px"
        borderRadius="full"
        bg="blue.900"
        opacity={0.1}
        animation="float 6s ease-in-out infinite"
        zIndex={0}
        filter="blur(40px)"
      />
      <Box
        position="fixed"
        top="60%"
        right="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="purple.900"
        opacity={0.1}
        animation="float 8s ease-in-out infinite reverse"
        zIndex={0}
        filter="blur(50px)"
      />
      <Box
        position="fixed"
        bottom="20%"
        left="20%"
        w="150px"
        h="150px"
        borderRadius="full"
        bg="green.900"
        opacity={0.1}
        animation="float 7s ease-in-out infinite"
        zIndex={0}
        filter="blur(30px)"
      />

      {/* Enhanced Header */}
      <Box 
        as="header" 
        py={6} 
        borderBottom="1px" 
        borderColor={headerBorder} 
        bg={headerBg}
        backdropFilter="blur(20px)"
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow={headerShadow}
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <img src="/logo.jpeg" alt="Squirrel AI Logo" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }} />
              <VStack align="start" spacing={0}>
                <Heading size="lg" bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text">
                  Squirrel AI
                </Heading>
                <Text fontSize="xs" color={mutedTextColor}>AI-Powered Code Analysis</Text>
              </VStack>
            </HStack>
            <HStack spacing={4}>
              <Tag colorScheme="green" variant="subtle" size="sm">
                <TagLeftIcon as={FiZap} />
                <TagLabel>AI-Powered</TagLabel>
              </Tag>
              <Tag colorScheme="blue" variant="subtle" size="sm">
                <TagLeftIcon as={FiGlobe} />
                <TagLabel>OpenAI</TagLabel>
              </Tag>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12} position="relative" zIndex={1}>
        {/* Enhanced Hero Section */}
        <VStack spacing={12} textAlign="center" mb={16}>
          <VStack spacing={6} maxW="4xl">
            <VStack spacing={4}>
              <Badge 
                colorScheme="purple" 
                variant="subtle" 
                px={3} 
                py={1} 
                borderRadius="full"
                animation="float 3s ease-in-out infinite"
              >
                <HStack spacing={2}>
                  <Icon as={FiTrendingUp} />
                  <Text>Latest Version 2.0</Text>
                </HStack>
              </Badge>
              <Heading 
                size="2xl" 
                bgGradient="linear(to-r, blue.600, purple.600)" 
                bgClip="text"
                lineHeight="1.2"
                fontWeight="extrabold"
                textShadow="0 2px 4px rgba(0,0,0,0.3)"
              >
                Understand Any GitHub Repository
                <br />
                <Text as="span" fontSize="xl" color={mutedTextColor} fontWeight="normal">
                  in Seconds with AI
                </Text>
              </Heading>
            </VStack>
            <Text 
              fontSize="xl" 
              color={mutedTextColor} 
              maxW="2xl" 
              lineHeight="1.6"
              textShadow="0 1px 2px rgba(0,0,0,0.2)"
            >
              Squirrel AI uses advanced AI to analyze your codebase, answer questions, and provide insights 
              that help you understand complex repositories instantly.
            </Text>
            <HStack spacing={4} pt={4}>
              <Button
                size="lg"
                colorScheme="blue"
                leftIcon={<FiPlay />}
                onClick={() => document.getElementById('repo-input')?.focus()}
                borderRadius="full"
                px={8}
                bgGradient="linear(to-r, blue.500, blue.600)"
                _hover={{ 
                  transform: 'translateY(-2px)', 
                  boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                  bgGradient: 'linear(to-r, blue.600, blue.700)'
                }}
                _active={{
                  transform: 'translateY(0)',
                  bgGradient: 'linear(to-r, blue.700, blue.800)'
                }}
                transition="all 0.2s"
              >
                Try It Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                leftIcon={<FiBookOpen />}
                borderRadius="full"
                px={8}
                borderColor={accentColor}
                color={accentColor}
                _hover={{ 
                  transform: 'translateY(-2px)',
                  bg: "blue.900",
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}
                transition="all 0.2s"
                onClick={onOpen}
              >
                View Examples
              </Button>
            </HStack>
          </VStack>

          {/* Enhanced Stats */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8} w="full" maxW="3xl">
            <Stat textAlign="center">
              <StatNumber 
                color={accentColor} 
                fontSize="3xl" 
                fontWeight="bold"
                textShadow="0 2px 4px rgba(59, 130, 246, 0.4)"
              >
                10+
              </StatNumber>
              <StatLabel color={mutedTextColor}>Languages Supported</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber 
                color={successColor} 
                fontSize="3xl" 
                fontWeight="bold"
                textShadow="0 2px 4px rgba(34, 197, 94, 0.4)"
              >
                Instant
              </StatNumber>
              <StatLabel color={mutedTextColor}>Analysis Speed</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber 
                color={warningColor} 
                fontSize="3xl" 
                fontWeight="bold"
                textShadow="0 2px 4px rgba(251, 146, 60, 0.4)"
              >
                100%
              </StatNumber>
              <StatLabel color={mutedTextColor}>Free to Use</StatLabel>
            </Stat>
            <Stat textAlign="center">
              <StatNumber 
                color={errorColor} 
                fontSize="3xl" 
                fontWeight="bold"
                textShadow="0 2px 4px rgba(239, 68, 68, 0.4)"
              >
                AI
              </StatNumber>
              <StatLabel color={mutedTextColor}>Powered</StatLabel>
            </Stat>
          </SimpleGrid>
        </VStack>

        {/* Demo Video Section */}
        <VStack spacing={8} mb={16}>
          <VStack spacing={4} textAlign="center">
            <Badge 
              colorScheme="green" 
              variant="subtle" 
              px={3} 
              py={1} 
              borderRadius="full"
            >
              <HStack spacing={2}>
                <Icon as={FiPlay} />
                <Text>See It In Action</Text>
              </HStack>
            </Badge>
            <Heading size="xl" bgGradient="linear(to-r, green.400, blue.400)" bgClip="text">
              Watch Squirrel AI Work
            </Heading>
            <Text fontSize="lg" color={mutedTextColor} maxW="2xl">
              See how Squirrel AI analyzes repositories and answers questions in real-time
            </Text>
          </VStack>
          
          <Card 
            bg={cardBg} 
            border="1px" 
            borderColor={borderColor} 
            borderRadius="2xl" 
            shadow="xl"
            overflow="hidden"
            backdropFilter="blur(20px)"
            maxW="4xl"
            w="full"
            _hover={{ 
              transform: 'translateY(-4px)', 
              shadow: '2xl',
              borderColor: 'green.400'
            }}
            transition="all 0.3s"
          >
            <CardBody p={0} position="relative">
              <video
                ref={videoRef}
                src="/test.mp4"
                controls
                style={{ width: '100%', height: 'auto', borderRadius: '1rem', display: 'block', background: 'black' }}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
              />
              {/* Video Overlay with Play Icon - Only show when not playing */}
              {!isVideoPlaying && (
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  pointerEvents="none"
                  opacity={0.85}
                  zIndex={1}
                >
                  <Box
                    bg="rgba(0, 0, 0, 0.0)"
                    borderRadius="full"
                    p={4}
                  >
                    <Icon as={FiPlay} w={16} h={16} color="white" />
                  </Box>
                </Box>
              )}
            </CardBody>
          </Card>
          
          {/* Call to Action */}
          <VStack spacing={4} pt={4}>
            <Text fontSize="lg" color={mutedTextColor} textAlign="center">
              Ready to analyze your own repositories?
            </Text>
            <Button
              size="lg"
              colorScheme="green"
              leftIcon={<FiGithub />}
              onClick={() => document.getElementById('repo-input')?.focus()}
              borderRadius="full"
              px={8}
              bgGradient="linear(to-r, green.500, green.600)"
              _hover={{ 
                transform: 'translateY(-2px)', 
                boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)',
                bgGradient: 'linear(to-r, green.600, green.700)'
              }}
              _active={{
                transform: 'translateY(0)',
                bgGradient: 'linear(to-r, green.700, green.800)'
              }}
              transition="all 0.2s"
            >
              Play with Squirrel AI Now
            </Button>
          </VStack>
        </VStack>

        {/* Enhanced Example Repositories */}
        <VStack spacing={6} mb={12}>
          <VStack spacing={2}>
            <Text fontSize="lg" color={mutedTextColor} fontWeight="medium">Try with popular repositories:</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
              {exampleRepos.map((repo, index) => (
                <Card 
                  key={index} 
                  bg={cardBg} 
                  border="1px" 
                  borderColor={borderColor} 
                  borderRadius="xl" 
                  shadow="md"
                  cursor="pointer"
                  backdropFilter="blur(15px)"
                  _hover={{ 
                    transform: 'translateY(-4px)', 
                    shadow: 'xl',
                    borderColor: accentColor,
                    bg: 'gray.700'
                  }}
                  transition="all 0.3s"
                  onClick={() => handleExampleSelect(repo.url)}
                >
                  <CardBody p={6}>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiStar} color={warningColor} />
                          <Text fontWeight="bold" color={textColor}>{repo.name}</Text>
                        </HStack>
                        <Badge colorScheme="blue" variant="subtle" size="sm">
                          {repo.language}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color={mutedTextColor} noOfLines={2} lineHeight="1.5">
                        {repo.description}
                      </Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color={mutedTextColor}>
                          ⭐ {repo.stars}
                        </Text>
                        <Icon as={FiExternalLink} color={mutedTextColor} />
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </VStack>

        {/* Enhanced Main Interface */}
        <VStack spacing={8} align="stretch">
          {/* Enhanced Input Section */}
          <Card 
            bg={cardBg} 
            border="1px" 
            borderColor={borderColor} 
            borderRadius="2xl" 
            shadow="xl"
            overflow="hidden"
            backdropFilter="blur(20px)"
            _hover={{ 
              transform: 'translateY(-2px)', 
              shadow: '2xl',
              borderColor: accentColor,
              backdropFilter: 'blur(30px)'
            }}
            transition="all 0.3s"
          >
            <CardBody p={8}>
              <VStack spacing={6}>
                <HStack spacing={3}>
                  <Box 
                    p={2} 
                    bg={`${accentColor}20`} 
                    borderRadius="full"
                    color={accentColor}
                  >
                    <Icon as={FiGithub} w={5} h={5} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color={textColor}>Repository Analysis</Heading>
                    <Text fontSize="sm" color={mutedTextColor}>Enter a GitHub URL to get started</Text>
                  </VStack>
                </HStack>
                <VStack spacing={4} w="full">
                  <Box position="relative" w="full">
                    <Input
                      id="repo-input"
                      size="lg"
                      placeholder="https://github.com/username/repository"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      borderColor={borderColor}
                      borderRadius="xl"
                      bg="gray.700"
                      _hover={{
                        bg: 'gray.600',
                        borderColor: accentColor
                      }}
                      _focus={{ 
                        borderColor: accentColor, 
                        boxShadow: `0 0 0 1px ${accentColor}`,
                        transform: 'scale(1.01)',
                        bg: 'gray.600'
                      }}
                      transition="all 0.2s"
                      pr={12}
                    />
                    {repoUrl && (
                      <IconButton
                        aria-label="Clear input"
                        icon={<FiX />}
                        size="sm"
                        variant="ghost"
                        position="absolute"
                        right={2}
                        top="50%"
                        transform="translateY(-50%)"
                        onClick={() => setRepoUrl('')}
                        color={mutedTextColor}
                        _hover={{ color: errorColor }}
                      />
                    )}
                  </Box>
                  <Button
                    size="lg"
                    colorScheme="blue"
                    onClick={analyzeRepo}
                    isLoading={isAnalyzing}
                    loadingText="Analyzing Repository..."
                    leftIcon={<FiSearch />}
                    w="full"
                    h={14}
                    borderRadius="xl"
                    bgGradient="linear(to-r, blue.500, blue.600)"
                    _hover={{ 
                      transform: 'translateY(-2px)', 
                      boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                      bgGradient: 'linear(to-r, blue.600, blue.700)'
                    }}
                    _active={{
                      transform: 'translateY(0)',
                      bgGradient: 'linear(to-r, blue.700, blue.800)'
                    }}
                    transition="all 0.2s"
                    isDisabled={!repoUrl.trim()}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Repository'}
                  </Button>
                </VStack>
                {isAnalyzing && (
                  <VStack spacing={3} w="full">
                    <Progress 
                      size="sm" 
                      isIndeterminate 
                      colorScheme="blue" 
                      w="full" 
                      borderRadius="full"
                      bg="blue.900"
                    />
                    <HStack spacing={2} color={mutedTextColor}>
                      <Spinner size="sm" color={accentColor} />
                      <Text fontSize="sm">
                        Analyzing code structure and generating insights...
                      </Text>
                    </HStack>
                  </VStack>
                )}
                {error && (
                  <Alert status="error" borderRadius="xl" variant="subtle">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Analysis Failed</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Enhanced Results Section with Tabs */}
          {(summary || readme || Object.keys(codeStructure).length > 0) && (
            <Card 
              bg={cardBg} 
              border="1px" 
              borderColor={borderColor} 
              borderRadius="2xl" 
              shadow="xl"
              overflow="hidden"
              backdropFilter="blur(20px)"
              _hover={{ 
                transform: 'translateY(-2px)', 
                shadow: '2xl',
                borderColor: accentColor,
                backdropFilter: 'blur(30px)'
              }}
              transition="all 0.3s"
            >
              <CardBody p={0}>
                <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
                  <TabList bg="gray.700" px={6} pt={6}>
                    <Tab 
                      borderRadius="lg" 
                      mr={2}
                      _selected={{ bg: cardBg, color: accentColor }}
                    >
                      <HStack spacing={2}>
                        <Icon as={FiCheckCircle} />
                        <Text>Summary</Text>
                      </HStack>
                    </Tab>
                    <Tab 
                      borderRadius="lg" 
                      mr={2}
                      _selected={{ bg: cardBg, color: accentColor }}
                    >
                      <HStack spacing={2}>
                        <Icon as={FiBookOpen} />
                        <Text>README</Text>
                      </HStack>
                    </Tab>
                    <Tab 
                      borderRadius="lg" 
                      mr={2}
                      _selected={{ bg: cardBg, color: accentColor }}
                    >
                      <HStack spacing={2}>
                        <Icon as={FiCode} />
                        <Text>Code Structure</Text>
                        {stats && (
                          <Badge colorScheme="blue" size="sm" variant="subtle">
                            {stats.total_files}
                          </Badge>
                        )}
                      </HStack>
                    </Tab>
                    <Tab 
                      borderRadius="lg"
                      _selected={{ bg: cardBg, color: accentColor }}
                    >
                      <HStack spacing={2}>
                        <Icon as={FiMessageSquare} />
                        <Text>Q&A</Text>
                      </HStack>
                    </Tab>
                  </TabList>

                  <TabPanels>
                    {/* Enhanced Summary Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={3}>
                          <Icon as={FiCheckCircle} w={5} h={5} color={successColor} />
                          <Heading size="md" color={textColor}>Repository Summary</Heading>
                        </HStack>
                        
                        {stats && (
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                            <Stat>
                              <StatNumber color={accentColor} fontSize="2xl">{stats.total_files}</StatNumber>
                              <StatLabel color={mutedTextColor}>Total Files</StatLabel>
                            </Stat>
                            <Stat>
                              <StatNumber color={successColor} fontSize="2xl">{stats.python_files}</StatNumber>
                              <StatLabel color={mutedTextColor}>Python Files</StatLabel>
                            </Stat>
                            <Stat>
                              <StatNumber color={warningColor} fontSize="2xl">{stats.js_files}</StatNumber>
                              <StatLabel color={mutedTextColor}>JS/TS Files</StatLabel>
                            </Stat>
                            <Stat>
                              <StatNumber color={errorColor} fontSize="2xl">{stats.total_functions}</StatNumber>
                              <StatLabel color={mutedTextColor}>Functions</StatLabel>
                            </Stat>
                          </SimpleGrid>
                        )}
                        
                        <Box 
                          p={6} 
                          bg="gray.700" 
                          borderRadius="xl"
                          border="1px"
                          borderColor={borderColor}
                        >
                          <ReactMarkdown>{summary}</ReactMarkdown>
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Enhanced README Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={3}>
                          <Icon as={FiBookOpen} w={5} h={5} color={warningColor} />
                          <Heading size="md" color={textColor}>README Content</Heading>
                        </HStack>
                        <Box
                          p={6}
                          bg="gray.700"
                          borderRadius="xl"
                          maxH="600px"
                          overflowY="auto"
                          border="1px"
                          borderColor={borderColor}
                        >
                          <ReactMarkdown>{readme}</ReactMarkdown>
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Enhanced Code Structure Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={3}>
                          <Icon as={FiCode} w={5} h={5} color={accentColor} />
                          <Heading size="md" color={textColor}>Code Structure</Heading>
                        </HStack>
                        <Box
                          p={6}
                          bg="gray.700"
                          borderRadius="xl"
                          maxH="600px"
                          overflowY="auto"
                          border="1px"
                          borderColor={borderColor}
                        >
                          {renderCodeStructure()}
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Enhanced Q&A Tab */}
                    <TabPanel>
                      <VStack spacing={6}>
                        <HStack spacing={3}>
                          <Box 
                            p={2} 
                            bg={`${successColor}20`} 
                            borderRadius="full"
                            color={successColor}
                          >
                            <Icon as={FiMessageSquare} w={5} h={5} />
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Heading size="md" color={textColor}>Ask Questions</Heading>
                            <Text fontSize="sm" color={mutedTextColor}>Get intelligent answers about the codebase</Text>
                          </VStack>
                        </HStack>
                        <VStack spacing={4} w="full">
                          <Box position="relative" w="full">
                            <Textarea
                              size="lg"
                              placeholder="Ask a question about the repository (e.g., 'How does the authentication work?' or 'What are the main components?')"
                              value={question}
                              onChange={(e) => setQuestion(e.target.value)}
                              rows={4}
                              borderColor={borderColor}
                              borderRadius="xl"
                              bg="gray.700"
                              _hover={{
                                bg: 'gray.600',
                                borderColor: successColor
                              }}
                              _focus={{ 
                                borderColor: successColor, 
                                boxShadow: `0 0 0 1px ${successColor}`,
                                transform: 'scale(1.01)',
                                bg: 'gray.600'
                              }}
                              transition="all 0.2s"
                              pr={12}
                            />
                            {question && (
                              <IconButton
                                aria-label="Clear question"
                                icon={<FiX />}
                                size="sm"
                                variant="ghost"
                                position="absolute"
                                right={2}
                                top={2}
                                onClick={() => setQuestion('')}
                                color={mutedTextColor}
                                _hover={{ color: errorColor }}
                              />
                            )}
                          </Box>
                          <Button
                            size="lg"
                            colorScheme="green"
                            onClick={askQuestion}
                            isLoading={isAsking}
                            loadingText="Generating Answer..."
                            leftIcon={<FiMessageSquare />}
                            w="full"
                            h={14}
                            borderRadius="xl"
                            bgGradient="linear(to-r, green.500, green.600)"
                            _hover={{ 
                              transform: 'translateY(-2px)', 
                              boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)',
                              bgGradient: 'linear(to-r, green.600, green.700)'
                            }}
                            _active={{
                              transform: 'translateY(0)',
                              bgGradient: 'linear(to-r, green.700, green.800)'
                            }}
                            transition="all 0.2s"
                            isDisabled={!summary || !question.trim()}
                          >
                            {isAsking ? 'Thinking...' : 'Ask Question'}
                          </Button>
                        </VStack>
                        {isAsking && (
                          <VStack spacing={3} w="full">
                            <Progress 
                              size="sm" 
                              isIndeterminate 
                              colorScheme="green" 
                              w="full" 
                              borderRadius="full"
                              bg="green.900"
                            />
                            <HStack spacing={2} color={mutedTextColor}>
                              <Spinner size="sm" color={successColor} />
                              <Text fontSize="sm">
                                Analyzing code and generating intelligent answer...
                              </Text>
                            </HStack>
                          </VStack>
                        )}

                        {/* Enhanced Answer Section */}
                        {answer && (
                          <VStack spacing={4} align="stretch" w="full">
                            <HStack spacing={3}>
                              <Box 
                                p={2} 
                                bg={`${warningColor}20`} 
                                borderRadius="full"
                                color={warningColor}
                              >
                                <Icon as={FiZap} w={5} h={5} />
                              </Box>
                              <VStack align="start" spacing={0}>
                                <Heading size="md" color={textColor}>Answer</Heading>
                                <Text fontSize="sm" color={mutedTextColor}>AI-generated response</Text>
                              </VStack>
                            </HStack>
                            
                            {contextFiles.length > 0 && (
                              <Box 
                                p={3} 
                                bg="blue.900" 
                                borderRadius="lg"
                                border="1px"
                                borderColor="blue.700"
                              >
                                <Text fontSize="sm" fontWeight="semibold" mb={1} color="blue.300">
                                  <Icon as={FiFile} mr={2} />
                                  Based on files:
                                </Text>
                                <Text fontSize="sm" color="blue.400">
                                  {contextFiles.slice(0, 3).join(', ')}
                                  {contextFiles.length > 3 && ` and ${contextFiles.length - 3} more`}
                                </Text>
                              </Box>
                            )}
                            
                            <Box 
                              p={6} 
                              bg="gray.700" 
                              borderRadius="xl"
                              border="1px"
                              borderColor={borderColor}
                              _hover={{
                                borderColor: successColor,
                                transform: 'translateY(-1px)',
                                shadow: 'md'
                              }}
                              transition="all 0.2s"
                            >
                              <ReactMarkdown>{answer}</ReactMarkdown>
                            </Box>
                          </VStack>
                        )}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>
          )}
        </VStack>

        {/* Enhanced Features Section */}
        <Box mt={20}>
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Badge colorScheme="purple" variant="subtle" px={3} py={1} borderRadius="full">
                Why Choose Squirrel AI?
              </Badge>
              <Heading size="xl" bgGradient="linear(to-r, blue.600, purple.600)" bgClip="text">
                Powerful AI Features
              </Heading>
              <Text fontSize="lg" color={mutedTextColor} maxW="2xl">
                Designed to make code exploration effortless and insightful.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="full">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  bg={cardBg} 
                  border="1px" 
                  borderColor={borderColor} 
                  borderRadius="2xl" 
                  shadow="lg" 
                  p={6}
                  backdropFilter="blur(15px)"
                  _hover={{ 
                    transform: 'translateY(-8px)', 
                    shadow: '2xl',
                    borderColor: `${feature.color}.300`,
                    bg: 'gray.700',
                    backdropFilter: 'blur(25px)'
                  }}
                  transition="all 0.3s"
                >
                  <VStack spacing={4} textAlign="center">
                    <Box 
                      p={4} 
                      bg={`${feature.color}.900`}
                      borderRadius="full"
                      color={`${feature.color}.300`}
                      _groupHover={{
                        transform: 'scale(1.1)',
                        bg: `${feature.color}.800`
                      }}
                      transition="all 0.2s"
                    >
                      <Icon as={feature.icon} w={8} h={8} />
                    </Box>
                    <Heading size="md" color={textColor}>{feature.title}</Heading>
                    <Text fontSize="sm" color={mutedTextColor} lineHeight="1.6">{feature.description}</Text>
                  </VStack>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>
      </Container>

      {/* Enhanced Footer */}
      <Box 
        as="footer" 
        py={12} 
        mt={20} 
        borderTop="1px" 
        borderColor={borderColor} 
        bg="gray.800"
        backdropFilter="blur(10px)"
      >
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4} w="full">
              <HStack spacing={3}>
                <Avatar size="sm" bg={accentColor} icon={<FiGithub />} name="Squirrel AI" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" color={textColor}>Squirrel AI</Text>
                  <Text fontSize="xs" color={mutedTextColor}>AI-Powered Code Analysis</Text>
                </VStack>
              </HStack>
              <HStack spacing={6}>
                <Link href="#" color={mutedTextColor} _hover={{ color: accentColor }} transition="color 0.2s">
                  <HStack spacing={2}>
                    <Icon as={FiShield} />
                    <Text>Privacy</Text>
                  </HStack>
                </Link>
                <Link href="#" color={mutedTextColor} _hover={{ color: accentColor }} transition="color 0.2s">
                  <HStack spacing={2}>
                    <Icon as={FiFile} />
                    <Text>Terms</Text>
                  </HStack>
                </Link>
                <Link href="#" color={mutedTextColor} _hover={{ color: accentColor }} transition="color 0.2s">
                  <HStack spacing={2}>
                    <Icon as={FiMessageSquare} />
                    <Text>Support</Text>
                  </HStack>
                </Link>
              </HStack>
            </Flex>
            <Divider borderColor={borderColor} />
            <Text fontSize="sm" color={mutedTextColor} textAlign="center">
              Powered by OpenAI & Advanced AI • Made with ❤️ for developers
            </Text>
          </VStack>
        </Container>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent bg={cardBg} color={textColor}>
          <ModalHeader>Select an Example Repository</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {exampleRepos.map((repo, idx) => (
                <Card
                  key={idx}
                  bg={cardBg}
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="xl"
                  shadow="md"
                  cursor="pointer"
                  _hover={{
                    transform: 'translateY(-4px)',
                    shadow: 'xl',
                    borderColor: accentColor,
                    bg: 'gray.700',
                  }}
                  transition="all 0.3s"
                  onClick={() => handleExampleSelect(repo.url)}
                >
                  <CardBody p={6}>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiStar} color={warningColor} />
                          <Text fontWeight="bold" color={textColor}>{repo.name}</Text>
                        </HStack>
                        <Badge colorScheme="blue" variant="subtle" size="sm">
                          {repo.language}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color={mutedTextColor} noOfLines={2} lineHeight="1.5">
                        {repo.description}
                      </Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color={mutedTextColor}>
                          ⭐ {repo.stars}
                        </Text>
                        <Icon as={FiExternalLink} color={mutedTextColor} />
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default App
