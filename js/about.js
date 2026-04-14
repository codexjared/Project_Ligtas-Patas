document.addEventListener("DOMContentLoaded", () => {
    gsap.timeline()
        .to(".wave-overlay", { left: "100%", duration: 1.5, ease: "power2.inOut" })
        .from(".reveal-text", { y: 50, opacity: 0, stagger: 0.2, duration: 1 }, "-=0.8")
        .from(".about-grid-container", {y: 10, opacity:0, duration: 0.5, delay:0})
        .from(".scroll-arrow", { opacity: 0, duration: 0.5 });

    const arrowDown = document.getElementById("scrollTrigger");
    const arrowUp = document.getElementById("scrollTopTrigger");
    const details = document.getElementById("details");

    arrowDown.addEventListener("click", () => {
        details.style.display = "block";
        gsap.to(window, { duration: 1.2, scrollTo: "#details", ease: "power2.inOut" });
        gsap.to(details, { opacity: 1, duration: 1 });
        gsap.to(arrowDown, { opacity: 0, pointerEvents: "none" });
    });

    arrowUp.addEventListener("click", () => {
        gsap.to(window, { duration: 1.2, scrollTo: 0, ease: "power2.inOut" });
        gsap.to(arrowDown, { opacity: 1, pointerEvents: "all", delay: 0.5 });
    });

    function setupSwitch(selector, photoId, nameId, bioId) {
        document.querySelectorAll(selector).forEach(circle => {
            circle.addEventListener('click', () => {
                const parent = circle.parentElement;
                parent.querySelectorAll('.circle').forEach(c => c.classList.remove('active'));
                circle.classList.add('active');

                gsap.to([`#${photoId}`, `#${nameId}`, `#${bioId}`], {
                    opacity: 0, x: 20, duration: 0.2,
                    onComplete: () => {
                        document.getElementById(nameId).innerText = circle.dataset.name;
                        document.getElementById(bioId).innerText = circle.dataset.bio;
                        document.getElementById(photoId).src = circle.dataset.img;
                        gsap.to([`#${photoId}`, `#${nameId}`, `#${bioId}`], { opacity: 1, x: 0, duration: 0.3 });
                    }
                });
            });
        });
    }

    setupSwitch('#dev-circles .circle', 'dev-photo', 'dev-name', 'dev-bio');
    setupSwitch('#team-circles .circle', 'team-photo', 'team-name', 'team-bio');

    const teamViewport = document.querySelector(".circle-viewport");
    const btnLeft = document.getElementById('team-left');
    const btnRight = document.getElementById('team-right');

    if (teamViewport && btnLeft && btnRight) {
        const scrollStep = 150; 

        btnLeft.addEventListener('click', () => {
            teamViewport.scrollBy({ left: -scrollStep, behavior: 'smooth' });
        });

        btnRight.addEventListener('click', () => {
            teamViewport.scrollBy({ left: scrollStep, behavior: 'smooth' });
        });
    }
});