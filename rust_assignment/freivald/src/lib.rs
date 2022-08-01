use ark_bls12_381::Fq;
use ark_ff::{UniformRand, Field, PrimeField};
use ndarray::{Array2, ArrayView2, Axis};
use rand::thread_rng;

struct Freivald {
    x: Array2<Fq>, // 2D array, each column is an iteration
}

impl Freivald {
    fn new(matrix_size: usize, iterations: usize) -> Self {
        // create a random number generator
        let ref mut rng = thread_rng();

        let mut x = Array2::<Fq>::zeros((matrix_size, iterations));
        for (_, mut col) in x.axis_iter_mut(Axis(1)).enumerate() {
            // Generate a random number for each iteration
            let r: Fq = Fq::rand(rng);

            // Populate iteration column with values r^i for i=0..matrix_size
            for (i, row) in col.iter_mut().enumerate() {
                *row = r.pow(&Fq::from(i as u128).into_repr());
            }
        }

        // Return freivald value with random numbers array
        Self {
            x
        }
    }

    fn verify(&self, matrix_a: &Array2<Fq>, matrix_b: &Array2<Fq>, supposed_ab: &Array2<Fq>) -> bool {
        // assert all matrices have equal sizes matching the Freivald size
        assert!(check_matrix_dimensions(matrix_a.view(), matrix_b.view(), supposed_ab.view(), self.x.nrows()));

        // loop over iterations, each increasing the certainty
        for i in 0..self.x.ncols() {
            // verify a single iteration column: a * b * x == c * x
            if matrix_a.dot(&matrix_b.dot(&self.x.column(i))) != supposed_ab.dot(&self.x.column(i)) {
                // return false if any iteration fails
                return false
            }
        }

        return true;
    }

    // utility function to not have to instantiate Freivalds if you just want to make one verification.
    fn verify_once(matrix_a: &Array2<Fq>, matrix_b: &Array2<Fq>, supposed_ab: &Array2<Fq>) -> bool {
        // assert all matrices have equal sizes matching the Freivald size
        assert!(check_matrix_dimensions(matrix_a.view(), matrix_b.view(), supposed_ab.view(), supposed_ab.nrows()));

        // create a Freivald with 1 iteration and verify
        let freivald = Freivald::new(supposed_ab.nrows(), 1);
        freivald.verify(matrix_a, matrix_b, supposed_ab)
    }
}

// [Bonus] Modify code to increase your certainty that A * B == C by iterating over the protocol.
// Note that you need to generate new vectors for new iterations or you'll be recomputing same
// value over and over. No problem in changing data structures used by the algorithm (currently its a struct
// but that can change if you want to)

// see test freivald_verify_multiple_iterations

// Added the size, if a Freivald is created with a certain size it must match the array sizes
pub fn check_matrix_dimensions(a: ArrayView2<Fq>, b: ArrayView2<Fq>, c: ArrayView2<Fq>, size: usize) -> bool {
    return a.nrows() == size && b.nrows() == size && c.nrows() == size
        && a.ncols() == size && b.ncols() == size && c.ncols() == size;
}


#[cfg(test)]
mod tests {
    // #[macro_use]
    use lazy_static::lazy_static;
    use ndarray::{Axis};
    use rand::SeedableRng;
    use rand_chacha::ChaCha8Rng;
    use rstest::rstest;

    use super::*;

    fn create_matrix(rng_seed: u64, dot_self: bool) -> Array2<Fq> {
        let ref mut rng = ChaCha8Rng::seed_from_u64(rng_seed);

        let mut c = Array2::<Fq>::zeros((200, 200));
        for (_, mut row) in c.axis_iter_mut(Axis(0)).enumerate() {
            for (_, col) in row.iter_mut().enumerate() {
                *col = Fq::rand(rng)
            }
        }

        if dot_self {
            return c.dot(&c);
        }
        return c;
    }

    lazy_static! {
        static ref MATRIX_A: Array2<Fq> = create_matrix(1, false);
        static ref MATRIX_A_DOT_A: Array2<Fq> = create_matrix(1, true);
        static ref MATRIX_B: Array2<Fq> = create_matrix(2, false);
        static ref MATRIX_B_DOT_B: Array2<Fq> = create_matrix(2, true);
        static ref MATRIX_C: Array2<Fq> = create_matrix(3, false);
        static ref MATRIX_C_DOT_C: Array2<Fq> = create_matrix(3, true);
    }

    #[rstest]
    #[case(&MATRIX_A, &MATRIX_A, &MATRIX_A_DOT_A)]
    #[case(&MATRIX_B, &MATRIX_B, &MATRIX_B_DOT_B)]
    #[case(&MATRIX_C, &MATRIX_C, &MATRIX_C_DOT_C)]
    fn freivald_verify_success_test(
        #[case] matrix_a: &Array2<Fq>,
        #[case] matrix_b: &Array2<Fq>,
        #[case] supposed_ab: &Array2<Fq>,
    ) {
        let freivald = Freivald::new(supposed_ab.nrows(), 1);
        assert!(freivald.verify(matrix_a, matrix_b, supposed_ab));
    }

    #[rstest]
    #[case(&MATRIX_A, &MATRIX_B, &MATRIX_A_DOT_A)]
    #[case(&MATRIX_B, &MATRIX_A, &MATRIX_B_DOT_B)]
    #[case(&MATRIX_C, &MATRIX_B, &MATRIX_C_DOT_C)]
    fn freivald_verify_fail_test(
        #[case] a: &Array2<Fq>,
        #[case] b: &Array2<Fq>,
        #[case] c: &Array2<Fq>,
    ) {
        let freivald = Freivald::new(c.nrows(), 1);
        assert!(!freivald.verify(a, b, c));
    }

    #[test]
    fn freivald_verify_multiple_iterations() {
        let freivald = Freivald::new(MATRIX_A_DOT_A.nrows(), 2);
        assert!(freivald.verify(&MATRIX_A, &MATRIX_A, &MATRIX_A_DOT_A));
    }
}
