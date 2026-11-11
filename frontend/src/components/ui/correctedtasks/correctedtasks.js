// correctedtasks.js
import DefaultSolution from './solutions/DefaultSolution';
import MultipleChoiceSolution from './solutions/MultipleChoiceSolution';
import OrderedSolution from './solutions/OrderedSolution';
import TableSolution from './solutions/TableSolution';

// Feladattípusonként: melyik komponens mutassa a megoldást (Solution)
// és a magyarázatot (Explanation). `null` = nem jelenik meg semmi.
export const taskTypes = {
    rovid_valasz: {
        Solution: DefaultSolution,
        Explanation: null,
    },
    tobb_opcio: {
        Solution: MultipleChoiceSolution,
        Explanation: null,
    },
    tobb_valasz: {
        Solution: MultipleChoiceSolution,
        Explanation: null,
    },
    sorba_rendezos: {
        Solution: OrderedSolution,
        Explanation: null,
    },
    tablazatos_feladat: {
        Solution: TableSolution,
        Explanation: null,
    }
};

export const fallbackType = {
    Solution: DefaultSolution,
    Explanation: null,
};