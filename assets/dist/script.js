const MILLISECONDS_PER_TIME = [
    7 * 24 * 60 * 60 * 1000, //week
    24 * 60 * 60 * 1000, //day
    60 * 60 * 1000, //hour
    60 * 1000, //minute
    1000 //second
];
const TIME_CATEGORIES = [
    'week',
    'day',
    'hour',
    'minute',
    'second'
];

window.run = () => {
    const legendEl = document.querySelector('._legend');

    //Scrolling
    document.addEventListener('scroll', e => {
        if (window.scrollY > 0) {
            document.body.classList.add('_is-scrolled');
        } else {
            document.body.classList.remove('_is-scrolled');
        }

        let articleEl = document.querySelector('main article');

        if (!articleEl) {
            return;
        }

        let boundingRect = articleEl.getBoundingClientRect();
        let percentScrolled = Math.max(Math.min(1, -1 * boundingRect.top / (boundingRect.height - window.innerHeight)), 0);
        percentScrolled = boundingRect.height < window.innerHeight ? 0 : percentScrolled;
        let rotation = 360 * percentScrolled;
        document.querySelector('nav ._well ._first ._progress').style.transform = 'rotateZ(' + Math.min(rotation, 180) + 'deg)';
        //Split rotation halfway between 'last' and it's child so that we transition over the gap where first and last meet
        document.querySelector('nav ._well ._last').style.transform = 'rotateZ(' + rotation / 2 + 'deg)';
        document.querySelector('nav ._well ._last ._progress').style.transform = 'rotateZ(' + rotation / 2 + 'deg)';

        if (percentScrolled == 1) {
            document.querySelector('body').classList.add('_scroll-complete');
        } else {
            document.querySelector('body').classList.remove('_scroll-complete');
        }

        if (legendEl) {
            if (legendEl.getBoundingClientRect().top <= 60) {
                legendEl.querySelector('h2').classList.remove('hgt-35');
                legendEl.querySelector('h2').classList.add('hgt-0');
            } else {
                legendEl.querySelector('h2').classList.remove('hgt-0');
                legendEl.querySelector('h2').classList.add('hgt-35');
            }
        }
    });

    //Search bar in footer
    document.querySelector('footer ._search').addEventListener('keydown', e => {
        if (e.key == 'Enter') {
            window.location.href = '/pages/search/#' + encodeURIComponent(e.target.value);
        }
    });

    //Contact form
    if (window.location.href.includes('/pages/contact')) {
        document.querySelectorAll('input, textarea').forEach(node => {
            node.addEventListener('input', e => {
                e.currentTarget.classList.remove('_is-invalid');
            });
        });

        document.querySelector('button#submit').addEventListener('click', () => {
            document.querySelectorAll('._is-invalid').forEach(node => {
                node.classList.remove('_is-invalid');
            });

            let data = {
                name: document.querySelector('input#name').value,
                email: document.querySelector('input#email').value,
                subject: document.querySelector('input#subject').value,
                message: document.querySelector('textarea#message').value
            };

            for (const [key, val] of Object.entries(data)) {
                if (val == '') {
                    document.querySelector('#' + key).classList.add('_is-invalid');
                }
            }
            if (document.querySelectorAll('._is-invalid').length) {
                return;
            }

            document.querySelector('button#submit').textContent = "Sending...";
            document.querySelector('button#submit').disabled = true;

            $.ajax({
                url: 'https://prod-09.northcentralus.logic.azure.com:443/workflows/d516b4b02fef4dfa864e7d53eb06f2f8/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0n3TlvvKXNAOgGzWCaZP0kq_bu2imlJpuU74_kmhw-A',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: e => {

                },
                error: e => {

                },
                complete: e => {
                    document.querySelector('._send').classList.add('dis-none');
                    document.querySelector('._sent-msg').classList.remove('dis-none');
                }
            })
        });
    }

    //Search
    if (window.location.href.indexOf('/search') > 0) {
        document.querySelector('input#search').focus();
        window.addEventListener('hashchange', searchHashChange);

        let searchTimer = null;
        document.querySelector('input#search').addEventListener('keydown', e => {
            if (searchTimer) {
                window.clearTimeout(searchTimer);
            }
            searchTimer = window.setTimeout(() => {
                window.location.hash = encodeURIComponent(e.target.value);
            }, 800);
        });

        searchHashChange();
    }

    //Mobile nav
    document.querySelector('nav._mobile ._icon').addEventListener('click', e => {
        if (document.querySelector('nav._mobile').classList.contains('_is-expanded')) {
            document.querySelector('nav._mobile').classList.remove('_is-expanded');
        } else {
            document.querySelector('nav._mobile').classList.add('_is-expanded');
        }
    });

    document.querySelector('nav._mobile ._collapser').addEventListener('click', e => {
        document.querySelector('nav._mobile').classList.remove('_is-expanded');
    });

    //Countdowns
    document.querySelectorAll('._date._countdown').forEach(node => {
        updateCountdown(node);
        window.setInterval(updateCountdown.bind(this, node), 1000);
    });

    //Highlights
    if (legendEl) {
        document.querySelectorAll('._highlight').forEach(node => {
            const curClass = node.getAttribute('data-class');
            node.addEventListener('mouseover', e => {
                document.querySelector(`._legend span[data-class="${curClass}"]`).classList.add('hover');
            });
            node.addEventListener('mouseout', e => {
                document.querySelector(`._legend span[data-class="${curClass}"]`).classList.remove('hover');
            });
            node.addEventListener('click', e => {
                document.querySelector(`._legend span[data-class="${curClass}"]`).classList.add('hover');
                window.setTimeout(() => {
                    document.querySelector(`._legend span[data-class="${curClass}"]`).classList.remove('hover');
                }, 500);
            });
        });
    }
};

function searchHashChange() {
    let results = [];
    document.querySelector('input#search').value = decodeURIComponent(window.location.hash.substring(1));
    document.querySelector('input#search + ._loading').classList.add('is-active');
    let done = false;
    let loadingTimer = window.setInterval(() => {
        if (done) {
            window.clearInterval(loadingTimer);

            let resultsEl = document.querySelector('._results');
            resultsEl.innerHTML = '';
            results.forEach(result => {
                let fullResultData = database.filter(doc => doc.url == result.ref)[0];

                let containerEl = document.createElement('a');
                containerEl.href = fullResultData.url;
                containerEl.className = 'dis-block mar-y-20 pad-20 bck-primary shd-md';

                let titleEl = document.createElement('h2');
                titleEl.textContent = fullResultData.title;
                containerEl.appendChild(titleEl);

                resultsEl.appendChild(containerEl);
            });

            document.querySelector('input#search + ._loading').classList.remove('is-active');
        }
    }, 200);
    let value = decodeURIComponent(window.location.hash.substring(1));
    try {
        results = value != '' ? index.search(value) : [];
    } catch (ex) {
        results = [];
    }
    done = true;
}

function updateCountdown(node) {
    let date = new Date(node.dataset.date);
    let millisecondsUntil = date.getTime() - new Date().getTime();
    if (millisecondsUntil > 0) { //Display countdown
        node.style.display = '';
        node.nextElementSibling.style.display = 'none';

        let timePerCategory = [];
        for (let i = 0; i < MILLISECONDS_PER_TIME.length; i++) {
            timePerCategory[i] = Math.max(0, Math.floor(millisecondsUntil / MILLISECONDS_PER_TIME[i]));
            millisecondsUntil -= timePerCategory[i] * MILLISECONDS_PER_TIME[i];
        }

        let startCategoryIdx = -1;
        for (let i = 0; i < MILLISECONDS_PER_TIME.length; i++) {
            if (timePerCategory[i] > 0 || MILLISECONDS_PER_TIME.length - i == 3) {
                startCategoryIdx = i;
                break;
            }
        }

        let nodeEls = node.querySelectorAll('div');
        for (let i = 0; i < 3; i++) {
            let catIdx = startCategoryIdx + i;
            nodeEls[i].querySelector('span._time').textContent = timePerCategory[catIdx];
            nodeEls[i].querySelector('span._time-category').textContent = TIME_CATEGORIES[catIdx] + (timePerCategory[catIdx] != 1 ? 's' : '');
        }
    } else { //Display event date
        node.style.display = 'none';
        node.nextElementSibling.style.display = '';
    }
}