import { useEffect, useRef } from 'react'
import { startStory } from '@/story/engine'
import { Logo } from '@/lib/site'

const Chevron = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>

export default function Home({ onTone }: { onTone: (t: 'light' | 'dark') => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const main = useRef<HTMLElement>(null)
  useEffect(() => {
    const stop = startStory(cv.current!, main.current!, t => onTone(t as 'light' | 'dark'))
    return () => { stop(); onTone('light') }
  }, [])

  return (
    <>
      <canvas id="stage" ref={cv} aria-hidden="true" />
      <div className="scrim" aria-hidden="true" />
      <main className="story" ref={main} id="main">
        {/* 1. 營隊的美好 */}
        <section className="short light" data-tone="light" data-active="true">
          <div className="copy">
            <h1 className="rv">寒暑假，一群學生<br />走進山邊海邊的小學。</h1>
            <p className="sub rv">帶營隊、課輔、陪伴孩子整天。孩子記得的那個夏天，是他們花一整個學期準備出來的。</p>
            <p className="hint rv">往下滑<Chevron /></p>
          </div>
        </section>

        {/* 2. 一個社團自己扛 */}
        <section className="tall light" data-tone="light">
          <div className="copy">
            <p className="pre rv">可是，這一切不會憑空而來。</p>
            <p className="pre rv">接下社團的那天起，</p>
            <h2 className="rv">招生、經費、教案、交接……<br />所有壓力，都得一個社團自己扛。</h2>
          </div>
        </section>

        {/* 3. 沉下去 */}
        <section className="short dark" data-tone="dark">
          <div className="copy">
            <p className="pre rv">除了社團夥伴本身，</p>
            <h2 className="rv">能支持的資源，卻少之又少。</h2>
          </div>
        </section>

        {/* 4. 一群社團 */}
        <section className="dark" data-tone="dark">
          <div className="copy">
            <h2 className="rv">全台上千個服務性社團、上萬名幹部，都是這樣。</h2>
            <p className="note rv">＊幹部人數依 1,000+ 社團 × 每屆約 10 位幹部估算</p>
          </div>
        </section>

        {/* 5. 每個社團手上都有別人需要的 */}
        <section className="tall dark" data-tone="dark">
          <div className="copy">
            <p className="pre rv">明明做著一樣的事，彼此去不同的地點也不衝突，</p>
            <h2 className="rv">為什麼，不能串聯？</h2>
            <p className="sub rv">每個社團手上，其實都有別人可以共享的經驗。</p>
          </div>
        </section>

        {/* 8. 分享，讓彼此更好 */}
        <section className="dark" data-tone="dark">
          <div className="copy">
            <p className="pre rv">當社團之間，能分享彼此的經驗、教學內容等資源，</p>
            <h2 className="rv">我們就有機會看到更多方法、更多可能，</h2>
            <p className="sub rv">也更知道，下一次能怎麼做得更好。</p>
          </div>
        </section>

        {/* 6. 海的另一邊：教育組織 */}
        <section className="dark" data-tone="dark">
          <div className="copy">
            <p className="pre rv">而在海的另一邊，</p>
            <h2 className="rv">50+ 教育組織、20+ 議題組織</h2>
            <p className="sub rv">有著專業的教學方法、上萬份教案及培訓資源，等待運用。</p>
          </div>
        </section>

        {/* 7. 海的另一邊：企業 */}
        <section className="dark" data-tone="dark">
          <div className="copy">
            <h2 className="rv">上萬間企業，都有 CSR 目標</h2>
            <p className="sub rv">30+ 企業、單位辦理相關贊助計畫，有些計畫卻接觸不到學生，或企業不知道能如何提供支持。</p>
          </div>
        </section>

        {/* 9. 布穀島社出場 */}
        <section className="tall dark" data-tone="dark">
          <div className="copy">
            <Logo className="mark rv" label="布穀島社" />
            <h2 className="rv">這，就是布穀島社想做的事。</h2>
            <p className="sub rv">把社團、教育組織和資源單位串成一張網，讓一次服務需要的三個面向都完整：</p>
            <ul className="facets rv" aria-label="一次服務的三個面向">
              <li><i style={{ background: '#F7C948' }} />資金與物資<span>贊助單位</span></li>
              <li><i style={{ background: '#6FCFD5' }} />教學內容<span>教育組織</span></li>
              <li><i style={{ background: '#F4A7A0' }} />志工品質<span>學生社團</span></li>
            </ul>
          </div>
        </section>

        {/* 9. 分享一份，換來一整張網 */}
        <section className="flow dark" data-tone="dark">
          <div className="head">
            <h2>你分享一份經驗，<br />就能接住上千份。</h2>
            <p className="sub">交流經驗、共享資源、一起成長。分享的社團越多，每個社團能用的就越多。</p>
          </div>
          <div className="routes">
            <div className="route">
              <svg viewBox="0 0 26 26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3 5h13v8H9l-4 3v-3H3z" /><path d="M19 9h4v8h-2v3l-4-3h-6v-2" /></svg>
              <h3>交流經驗</h3>
              <p>寫下你們社團的做法、踩過的坑，在交流會和專欄裡分享。下一屆、隔壁校的社團，都能少走一段路。</p>
              <div className="go"><a href="#column">讀專欄</a><a href="#events">看活動</a></div>
            </div>
            <div className="route">
              <svg viewBox="0 0 26 26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M13 7c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V6c-3-1-6-1-9 1z" /><path d="M13 7v14" /></svg>
              <h3>共享資源</h3>
              <p>你上傳一份教案，就能用到其他社團的教案、講師名單與贊助資訊。</p>
              <div className="go"><a href="#resources">查資料庫</a><a href="#handbook">翻手冊</a></div>
            </div>
            <div className="route">
              <svg viewBox="0 0 26 26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 23V11" /><path d="M13 14c0-4 3-7 8-7 0 5-3 7-8 7z" /><path d="M13 17c0-3-2-6-7-6 0 4 2 6 7 6z" /></svg>
              <h3>一起成長</h3>
              <p>缺講師、缺物資時提出需求；有餘力時，也去接住別人的需求。</p>
              <div className="go"><a href="#match">需求媒合</a><a href="#map">社團地圖</a></div>
            </div>
          </div>
        </section>

        {/* 10. 被看見 */}
        <section className="dark" data-tone="dark">
          <div className="copy">
            <p className="pre rv">當點連成了面，</p>
            <h2 className="rv">企業、基金會與教育組織，終於找得到他們。</h2>
            <p className="sub rv">資源單位不必一間一間找，能把服務性社團當成一個整體來合作。</p>
          </div>
        </section>

        {/* 11. 回到孩子 */}
        <section className="dark" data-tone="dark">
          <div className="copy">
            <p className="pre rv">這些力量像洋流一樣匯聚，</p>
            <h2 className="rv">最後回到孩子身上。</h2>
            <p className="sub rv">讓全台灣的孩子，越來越好。</p>
          </div>
        </section>

        {/* 12. 加入 */}
        <section className="cta light" data-tone="light">
          <div className="copy">
            <div className="panel rv">
              <p className="vision">願有一天，每座投入教育的島嶼，都能突破圈層限制，形成彼此支持的島鏈。</p>
              <h2>成為島鏈的一份子</h2>
              <ol className="join-steps">
                <li><b>填寫會員申請表單</b><span>約 3 分鐘，社團、資源單位或個人都可以申請。</span></li>
                <li><b>填寫社團訪談文件</b><span>分享你們的做法和真正需要的支持，經你們審稿後才會公開。</span></li>
                <li><b>正式加入島鏈</b><span>收到整理好的教案、贊助資訊與講師名單，也能看到其他社團的經驗整理。</span></li>
              </ol>
              <div className="btns">
                <a className="btn primary" href="#join">申請加入島鏈</a>
                <a className="btn ghost" href="#resources">先逛逛資料庫</a>
              </div>
              <p style={{ margin: 0 }}><a className="ig" href="https://www.instagram.com/cuckoo_island/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>@cuckoo_island</a></p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
