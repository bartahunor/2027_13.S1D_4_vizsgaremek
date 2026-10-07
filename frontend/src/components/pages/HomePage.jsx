import TestimonialSection from "../sections/homepage/TestimonialSection";
import CTASection from "../sections/homepage/CTASection";
import RecommendedSubjectsSection from "../sections/homepage/RecommendedSubjectsSection";
import Hero from "../sections/homepage/Hero";
import WorkFlow from "../sections/homepage/WorkFlow";

function HomePage() {
    return (
        <div >
            <div className="h-20"></div>
            <Hero />
            <WorkFlow />
            <RecommendedSubjectsSection />
            <TestimonialSection />
            <CTASection />
        </div>
    );
}

export default HomePage;