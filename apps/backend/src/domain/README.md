# domain

The heart of the backend. This layer holds the **invariants** of every object the
system reasons about - the rules that must *always* be true for an object to exist.

**This is NOT a folder of interfaces.** A `Company`, an `Indicator`, a `Cohort` are
real things here, each one responsible for guarding its own consistency:

- An `Indicator` value can't be negative when it represents a rate.
- A `Cohort` is invalid below the k-anonymity threshold (>= 5 companies).
- An email on an `Account` must be well-formed before the object can be constructed.

If a rule is universal to the object - true regardless of who calls it, regardless of
database or HTTP - it lives here, enforced in the object itself (constructor, factory,
or value object), not validated ad-hoc somewhere else.

What does **not** belong here: use-case orchestration (-> `application`), HTTP/route
concerns (-> `interface`), database or external-API code (-> `infra`). The domain
depends on nothing outward; everything else depends on it.
