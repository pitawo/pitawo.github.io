// main.js
// 方針は source/site.md §4「JavaScript の扱い」を参照。
//
// 土台は overflow-x: auto + scroll-snap（CSS だけで全件見える）。
// ここで足すのは矢印ボタンとドットの「上乗せ」だけ。
// JS が動かなくても中身には到達できる（矢印・ドットは hidden のまま残る）。
// イージングは自前で書かない。scrollIntoView の smooth に任せる。

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

    document.querySelectorAll("[data-carousel]").forEach(enhanceCarousel);
    document.querySelectorAll("[data-shots]").forEach(enhanceShots);
})();
