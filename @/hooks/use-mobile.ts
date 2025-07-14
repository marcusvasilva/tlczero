import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<{
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    width: number
  }>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0
  })

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      
      const isMobile = width < MOBILE_BREAKPOINT
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
      const isDesktop = width >= TABLET_BREAKPOINT
      
      setScreenSize({
        isMobile,
        isTablet,
        isDesktop,
        width
      })
    }

    // Verificar tamanho inicial
    checkScreenSize()

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return {
    ...screenSize,
    // Helpers
    isMobileOrTablet: screenSize.isMobile || screenSize.isTablet,
    isTabletOrDesktop: screenSize.isTablet || screenSize.isDesktop,
    screenType: screenSize.isMobile ? 'mobile' : screenSize.isTablet ? 'tablet' : 'desktop' as const
  }
}
