// main.js
// 方針は source/site.md §4「JavaScript の扱い」を参照。
//
// 土台は overflow-x: auto + scroll-snap（CSS だけで全件見える）。
// ここで足すのは矢印ボタンとドットの「上乗せ」だけ。
// JS が動かなくても中身には到達できる（矢印・ドットは hidden のまま残る）。
// イージングは自前で書かない。scrollIntoView の smooth に任せる（例外：下の initHeroMotion のみ）。

(function () {
    "use strict";

    function goTo(items, index) {
        var clamped = Math.max(0, Math.min(items.length - 1, index));
        items[clamped].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }

    function currentIndex(track, items) {
        var trackLeft = track.getBoundingClientRect().left;
        var closest = 0;
        var closestDist = Infinity;
        items.forEach(function (item, i) {
            var dist = Math.abs(item.getBoundingClientRect().left - trackLeft);
            if (dist < closestDist) {
                closestDist = dist;
                closest = i;
            }
        });
        return closest;
    }

    // ドットを生成し、クリックで該当スライドへ、スクロール位置に応じて aria-current を更新する。
    // 枚数が見えることが目的なので、矢印を持たないスライドにも付けられる。
    // scrollRoot は実際に overflow-x: auto を持つ要素（IntersectionObserver の root に使う）。
    function attachDots(scrollRoot, items, dotsWrap, dotClassName, labelFn) {
        if (!dotsWrap || items.length < 2) {
            return;
        }
        dotsWrap.hidden = false;

        var dots = items.map(function (_, i) {
            var dot = document.createElement("button");
            dot.type = "button";
            dot.className = dotClassName;
            dot.setAttribute("aria-label", labelFn(i));
            dot.addEventListener("click", function () {
                goTo(items, i);
            });
            dotsWrap.appendChild(dot);
            return dot;
        });

        if ("IntersectionObserver" in window) {
            var observer = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) {
                            return;
                        }
                        var i = items.indexOf(entry.target);
                        dots.forEach(function (dot, di) {
                            dot.setAttribute("aria-current", di === i ? "true" : "false");
                        });
                    });
                },
                { root: scrollRoot, threshold: 0.6 }
            );
            items.forEach(function (item) {
                observer.observe(item);
            });
        } else {
            dots[0].setAttribute("aria-current", "true");
        }
    }

    // トップの代表3件カルーセル：矢印＋ドット
    function enhanceCarousel(root) {
        var track = root.querySelector("[data-carousel-track]");
        var prevBtn = root.querySelector("[data-carousel-prev]");
        var nextBtn = root.querySelector("[data-carousel-next]");
        var dotsWrap = document.querySelector("[data-carousel-dots]");

        if (!track || !prevBtn || !nextBtn) {
            return;
        }

        var items = Array.prototype.slice.call(track.children);
        if (items.length < 2) {
            return; // 1件しかなければ矢印もドットも要らない
        }

        prevBtn.hidden = false;
        nextBtn.hidden = false;

        prevBtn.addEventListener("click", function () {
            goTo(items, currentIndex(track, items) - 1);
        });

        nextBtn.addEventListener("click", function () {
            goTo(items, currentIndex(track, items) + 1);
        });

        attachDots(track, items, dotsWrap, "carousel-dot", function (i) {
            return (i + 1) + "件目の作品を表示";
        });
    }

    // 各カード内のスクリーンショット（3枚）：ドットのみ。枚数があると分かることが目的
    function enhanceShots(root) {
        var track = root.querySelector("[data-shots-track]");
        var dotsWrap = root.parentElement
            ? root.parentElement.querySelector("[data-shots-dots]")
            : null;

        if (!track) {
            return;
        }

        var items = Array.prototype.slice.call(track.children);
        if (items.length < 2) {
            return;
        }

        // overflow-x: auto を持つのは root（.work-shots）自身。track（ul）ではない
        attachDots(root, items, dotsWrap, "shots-dot", function (i) {
            return (i + 1) + "枚目の画面を表示";
        });
    }


    // ---------- トップのモーション（Taka 指示 2026-09-30・site.md §4 の例外）----------
    // ヒーロー背景の「斜めの線と円」（Image/hero-bg.webp）と同じ図形を Canvas で描き、ゆっくり動かす。
    // 円が息をするように膨らみ、斜線が一方向に流れる。それだけ。
    // 動きの計算に自前のイージング（smooth / Math.sin）を使う。ここだけの例外。
    function initHeroMotion() {
        var hero = document.getElementById("hero");
        var canvas = hero && hero.querySelector("[data-hero-motion]");
        var note = hero && hero.querySelector("[data-hero-note]");
        if (!canvas || !canvas.getContext) {
            return;
        }
        var ctx = canvas.getContext("2d");
        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        var W = 0;
        var H = 0;
        var raf = 0;
        var startTime = 0;
        var visible = true;

        // 0→1 をなめらかに（端でゆっくり）
        function smooth(x) {
            x = Math.max(0, Math.min(1, x));
            return x * x * (3 - 2 * x);
        }

        function resize() {
            var rect = canvas.getBoundingClientRect();
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = rect.width;
            H = rect.height;
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        // t: 経過秒。intro=false のときは描き込み済みの状態で描く
        function draw(t, intro) {
            ctx.clearRect(0, 0, W, H);
            var narrow = W < 640;
            var ax = W * (narrow ? 0.9 : 0.8);
            var ay = H * (narrow ? 1.0 : 0.95);
            var R = Math.min(W * (narrow ? 0.7 : 0.42), 460);
            var color = "102,126,234";
            var alpha = narrow ? 0.2 : 0.34; // 狭い幅では文字と重なるので薄くする

            // 円：中心を少しずつずらした4つ。ゆっくり膨らんで縮む
            ctx.lineWidth = 1;
            for (var i = 0; i < 4; i++) {
                var r = R * (0.32 + i * 0.26) * (1 + 0.025 * Math.sin(t * 0.5 + i * 1.3));
                var p = intro ? smooth((t - i * 0.25) / 1.8) : 1;
                if (p <= 0) {
                    continue;
                }
                ctx.strokeStyle = "rgba(" + color + "," + alpha + ")";
                ctx.beginPath();
                ctx.arc(ax - i * R * 0.06, ay + i * R * 0.04, r, Math.PI, Math.PI + Math.PI * 2 * p);
                ctx.stroke();
            }

            // 斜線：x + y = c の線を一定方向に流し、最大の円の内側だけを描く
            var gap = 26;
            var count = 12;
            var span = gap * count;
            var c0 = ax + ay - R * 0.5;
            var shift = (t * 5) % gap;
            var maxR = R * 1.06;
            var lp = intro ? smooth((t - 0.4) / 1.6) : 1;
            for (var k = -count; k <= count; k++) {
                var off = k * gap + shift;
                var fade = 1 - Math.pow(Math.abs(off) / span, 2);
                if (fade <= 0) {
                    continue;
                }
                var c = c0 + off;
                // 線 x+y=c と、中心 (ax, ay) 半径 maxR の円の交点（中心からの距離 d）
                var d = (c - ax - ay) / Math.SQRT2;
                if (Math.abs(d) >= maxR) {
                    continue;
                }
                var half = Math.sqrt(maxR * maxR - d * d) * lp;
                // 線の中点と方向 (1,-1)/√2
                var mx = ax + d / Math.SQRT2;
                var my = ay + d / Math.SQRT2;
                var ux = half / Math.SQRT2;
                ctx.strokeStyle = "rgba(" + color + "," + (alpha * fade).toFixed(3) + ")";
                ctx.beginPath();
                ctx.moveTo(mx - ux, my + ux);
                ctx.lineTo(mx + ux, my - ux);
                ctx.stroke();
            }
        }

        function frame(now) {
            raf = 0;
            if (!visible || document.hidden || reduced.matches) {
                return;
            }
            draw((now - startTime) / 1000, true);
            raf = requestAnimationFrame(frame);
        }

        function start() {
            if (!raf && visible && !document.hidden && !reduced.matches) {
                raf = requestAnimationFrame(function (now) {
                    if (!startTime) {
                        startTime = now;
                    }
                    frame(now);
                });
            }
        }

        function stop() {
            if (raf) {
                cancelAnimationFrame(raf);
                raf = 0;
            }
        }

        function setNote() {
            if (!note) {
                return;
            }
            var text = note.querySelector("[data-hero-note-text]");
            if (text) {
                text.textContent = reduced.matches
                    ? "この図は、Claude Code と一緒に書いたコード（外部ライブラリなし）で描いています。"
                    : "このアニメーションは、Claude Code と一緒に書いたコード（外部ライブラリなし）で動いています。";
            }
            note.hidden = false;
        }

        function apply() {
            resize();
            setNote();
            if (reduced.matches) {
                stop();
                draw(0, false);
            } else {
                start();
            }
        }

        hero.classList.add("hero--motion");
        apply();

        if ("ResizeObserver" in window) {
            new ResizeObserver(function () {
                resize();
                if (!raf) {
                    // 止まっている間（reduced-motion・非表示）は静止の1コマを描き直す
                    draw(reduced.matches || !startTime ? 0 : (performance.now() - startTime) / 1000, false);
                }
            }).observe(canvas);
        } else {
            window.addEventListener("resize", resize);
        }
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                if (visible) {
                    start();
                } else {
                    stop();
                }
            }).observe(hero);
        }
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });
        var onChange = function () {
            apply();
        };
        if (reduced.addEventListener) {
            reduced.addEventListener("change", onChange);
        }
    }

    initHeroMotion();

    document.querySelectorAll("[data-carousel]").forEach(enhanceCarousel);
    document.querySelectorAll("[data-shots]").forEach(enhanceShots);
})();
