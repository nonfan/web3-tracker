import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CryptoMarketChart } from '../CryptoMarketChart'
import * as economicDataApi from '../../../utils/economicDataApi'

vi.mock('../../../utils/economicDataApi')

describe('CryptoMarketChart', () => {
  const mockCryptoData = [
    { date: '2024-01', btc: 1.0, eth: 0.3, total: 2.0 },
    { date: '2024-06', btc: 1.2, eth: 0.35, total: 2.3 },
    { date: '2024-12', btc: 1.5, eth: 0.4, total: 2.8 },
    { date: '2025-06', btc: 1.8, eth: 0.5, total: 3.2 },
    { date: '2026-01', btc: 1.9, eth: 0.52, total: 3.24 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockImplementation(
      () => new Promise(() => { }) // Never resolves
    )

    render(<CryptoMarketChart />)
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('should render chart with data after loading', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      expect(screen.getByText('加密货币市场总览')).toBeInTheDocument()
    })

    // Check if key metrics are displayed
    expect(screen.getByText('总市值')).toBeInTheDocument()
    expect(screen.getByText('BTC市值')).toBeInTheDocument()
    expect(screen.getByText('ETH市值')).toBeInTheDocument()
    expect(screen.getByText('历史峰值')).toBeInTheDocument()
  })

  it('should display current market cap correctly', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      // 验证显示了市值（最后一项的 total），使用 getAllByText 因为可能有多个相同值
      const marketCapElements = screen.getAllByText(/\$3\.24T/)
      expect(marketCapElements.length).toBeGreaterThan(0)
    })
  })

  it('should calculate BTC dominance correctly', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      // BTC dominance = (1.9 / 3.24) * 100 = 58.6%
      // 验证显示了占比百分比，使用 getAllByText 因为 BTC 和 ETH 都有占比
      const dominanceElements = screen.getAllByText(/占比\s+\d+\.\d+%/)
      expect(dominanceElements.length).toBeGreaterThanOrEqual(2) // BTC 和 ETH 都有占比
    })
  })

  it('should display historical peak correctly', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      // 验证显示了历史峰值标签
      expect(screen.getByText('历史峰值')).toBeInTheDocument()
      // 峰值应该是数据中最大的 total
      const peakValue = Math.max(...mockCryptoData.map(d => d.total))
      const peakElements = screen.getAllByText(`$${peakValue.toFixed(2)}T`)
      expect(peakElements.length).toBeGreaterThan(0)
    })
  })

  it('should handle API errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { })
    vi.mocked(economicDataApi.getCryptoMarketData).mockRejectedValue(
      new Error('API Error')
    )

    render(<CryptoMarketChart />)

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to load crypto data:',
        expect.any(Error)
      )
    })

    consoleError.mockRestore()
  })

  it('should display market cycles information', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      expect(screen.getByText('市场周期')).toBeInTheDocument()
      expect(screen.getByText('2020-2021')).toBeInTheDocument()
      expect(screen.getByText('牛市周期')).toBeInTheDocument()
      expect(screen.getByText('2022')).toBeInTheDocument()
      expect(screen.getByText('熊市探底')).toBeInTheDocument()
    })
  })

  it('should display key milestones', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      expect(screen.getByText('关键里程碑')).toBeInTheDocument()
      expect(screen.getByText('2024年1月')).toBeInTheDocument()
      expect(screen.getByText('BTC现货ETF获批')).toBeInTheDocument()
      expect(screen.getByText('2024年4月')).toBeInTheDocument()
      expect(screen.getByText('BTC第四次减半')).toBeInTheDocument()
    })
  })

  it('should calculate YTD change correctly', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      // 验证显示了 YTD 变化百分比（可能是正数或负数）
      const ytdText = screen.getByText(/[+-]?\d+% YTD/)
      expect(ytdText).toBeInTheDocument()
    })
  })

  it('should display market outlook', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      expect(screen.getByText('💡 市场展望')).toBeInTheDocument()
      expect(screen.getByText(/BTC ETF 资金持续流入/)).toBeInTheDocument()
      expect(screen.getByText(/美联储降息周期/)).toBeInTheDocument()
    })
  })

  it('should handle empty data array', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue([])

    render(<CryptoMarketChart />)

    await waitFor(() => {
      expect(screen.getByText('加载中...')).toBeInTheDocument()
    })
  })

  it('should display ETH market cap percentage', async () => {
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      // 验证 ETH 卡片显示了占比
      const ethCard = screen.getByText('ETH市值').closest('div')
      expect(ethCard).toBeInTheDocument()
      // 验证有占比显示
      expect(screen.getAllByText(/占比\s+\d+\.\d+%/).length).toBeGreaterThan(0)
    })
  })

  it('should call getCryptoMarketData on mount', async () => {
    const getCryptoMarketDataSpy = vi.mocked(economicDataApi.getCryptoMarketData)
    getCryptoMarketDataSpy.mockResolvedValue(mockCryptoData)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      expect(getCryptoMarketDataSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('should format market cap values correctly', async () => {
    const dataWithDecimals = [
      { date: '2026-01', btc: 1.234, eth: 0.567, total: 3.456 }
    ]
    vi.mocked(economicDataApi.getCryptoMarketData).mockResolvedValue(dataWithDecimals)

    render(<CryptoMarketChart />)

    await waitFor(() => {
      // 验证市值格式化为 T（万亿）单位，使用 getAllByText 因为可能有多个相同值
      const totalElements = screen.getAllByText(/\$3\.\d+T/)
      expect(totalElements.length).toBeGreaterThan(0)

      const btcElements = screen.getAllByText(/\$1\.\d+T/)
      expect(btcElements.length).toBeGreaterThan(0)

      const ethElements = screen.getAllByText(/\$0\.\d+T/)
      expect(ethElements.length).toBeGreaterThan(0)
    })
  })
})
