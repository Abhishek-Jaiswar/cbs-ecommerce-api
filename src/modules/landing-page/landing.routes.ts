import { Router }
from "express";

import {
 landingPageController,
}
from "./landing.controller.js";

const router: Router =
Router();


router.post(
 "/",
 landingPageController.create
);


router.get(
 "/",
 landingPageController.getAll
);


router.get(
 "/:id",
 landingPageController.getById
);


router.get(
 "/slug/:slug",
 landingPageController.getBySlug
);


router.put(
 "/:id",
 landingPageController.update
);

router.delete(
 "/:id",
 landingPageController.delete
);


router.patch(
 "/:id/publish",
 landingPageController.publish
);


router.patch(
 "/:id/unpublish",
 landingPageController.unpublish
);

export default router;