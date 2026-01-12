import Navbar from "./Cx/Layout/Navbar";
import Hero from "./Cx/Sections/Hero";
import Brands from "./Cx/Sections/Brands";
import Categories from "./Cx/Sections/Categories";
import FeaturedProducts from "./Cx/Sections/FeaturedProducts";
import Printers from "./Cx/Sections/Printers";
import Laptop from "./Cx/Sections/Laptop";
import LED from "./Cx/Sections/LED";
import PromotionalBanners from "./Cx/Sections/PromotionalBanners";
import CompanyCarousel from "./Cx/Sections/CompanyCarousel";
import Charger from "./Cx/Sections/Charger";
import Testimonials from "./Cx/Sections/Testimonials";
import Map from "./Cx/Sections/Map";
import Videos from "./Cx/Sections/Videos";
import Footer from "./Cx/Layout/Footer";

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Brands />
      <Categories />
      <FeaturedProducts />
      <PromotionalBanners />
      <Laptop />
      <Printers />
      <LED />
      <CompanyCarousel />
      <Charger />
      <Testimonials />
      <Map />
      <Videos />
      <Footer />
    </div>
  );
}
