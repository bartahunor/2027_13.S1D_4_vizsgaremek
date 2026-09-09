
import { Link } from 'react-router-dom'

function CTASection() {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      <div className="max-w-5xl mx-auto bg-secondary rounded-[3rem] p-12 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl z-10">

        {/* Bal felső lila fény */}
        <div
            className="
          absolute
          -top-32
          -right-32
          w-[450px]
          h-[450px]
          rounded-full
          bg-purple-500/20
          blur-3xl
          pointer-events-none
          animate-cta-glow
      "
          />

          <div
            className="
          absolute
          -bottom-32
          -left-32
          w-[450px]
          h-[450px]
          rounded-full
          bg-indigo-400/20
          blur-3xl
          pointer-events-none
          animate-cta-glow-reverse
      "
          />

        {/* Felső jobb dekoráció */}
        <div
          className="
                        absolute
                        top-0
                        right-0
                        w-64
                        h-64
                        bg-white/10
                        rounded-full
                        -mr-32
                        -mt-32
                        animate-float-subtle
                        pointer-events-none
                    "
        />

        {/* Felső jobb kör */}
        <div
          className="
                        absolute
                        top-6
                        right-6
                        w-80
                        h-80
                        border
                        border-white/10
                        rounded-full
                        -mr-40
                        -mt-40
                        animate-spin-slow
                        pointer-events-none
                    "
        />

        {/* Alsó bal dekoráció */}
        <div
          className="
                        absolute
                        bottom-0
                        left-0
                        w-48
                        h-48
                        bg-white/5
                        rounded-full
                        -ml-24
                        -mb-24
                        animate-pulse-slow
                        pointer-events-none
                    "
        />

        {/* Alsó bal kör */}
        <div
          className="
                        absolute
                        bottom-8
                        left-8
                        w-72
                        h-72
                        border
                        border-white/10
                        rounded-full
                        -ml-36
                        -mb-36
                        animate-spin-slow
                        pointer-events-none
                    "
          style={{ animationDirection: "reverse" }}
        />

        {/* Finom fényátmenet */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />

        <h2 className="text-4xl lg:text-5xl font-black mb-6 relative z-10">
          Kezdd el a felkészülést még ma!
        </h2>

        <p className="text-primary/20 text-lg opacity-80 mb-10 max-w-2xl mx-auto relative z-10 text-white/80">
          Csatlakozz több ezer sikeres érettségizőhöz és érd el az álmaid.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
          <Link
            id="regisztracio"
            to="/register"
            className="
                            bg-white
                            text-primary
                            px-10
                            py-4
                            rounded-xl
                            font-bold
                            text-xl
                            hover:scale-105
                            transition-transform
                            inline-block
                            text-center
                            shadow-lg
                            shadow-black/10
                        "
          >
            Regisztráció
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;


