export default function DefaultExplanation({ forrasKep }) {
    if (!forrasKep) return null;

    return (
        <img
            src={forrasKep}
            alt="Forrás"
            className="max-w-full rounded-lg border border-[#351F5B]/10"
        />
    );
}