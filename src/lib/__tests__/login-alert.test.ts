import { describe, expect, it } from "vitest"
import { describeUserAgent, ipFromHeaders } from "@/lib/login-alert"

describe("describeUserAgent", () => {
  it("identifica Chrome no Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    expect(describeUserAgent(ua)).toEqual({ navegador: "Chrome", sistema: "Windows" })
  })

  it("identifica Edge apesar do Chrome/ no user agent", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
    expect(describeUserAgent(ua).navegador).toBe("Edge")
  })

  it("identifica Safari no iPhone", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
    expect(describeUserAgent(ua)).toEqual({ navegador: "Safari", sistema: "iPhone" })
  })

  it("identifica Firefox no macOS", () => {
    const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0"
    expect(describeUserAgent(ua)).toEqual({ navegador: "Firefox", sistema: "macOS" })
  })

  it("identifica Chrome no Android", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
    expect(describeUserAgent(ua)).toEqual({ navegador: "Chrome", sistema: "Android" })
  })

  it("retorna desconhecido para string vazia", () => {
    expect(describeUserAgent("")).toEqual({
      navegador: "Navegador desconhecido",
      sistema: "Sistema desconhecido",
    })
  })
})

describe("ipFromHeaders", () => {
  it("pega o primeiro IP do x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 70.41.3.18" })
    expect(ipFromHeaders(headers)).toBe("203.0.113.10")
  })

  it("cai para o x-real-ip sem forward", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.7" })
    expect(ipFromHeaders(headers)).toBe("198.51.100.7")
  })

  it("retorna null sem nenhum header de IP", () => {
    expect(ipFromHeaders(new Headers())).toBeNull()
  })
})
