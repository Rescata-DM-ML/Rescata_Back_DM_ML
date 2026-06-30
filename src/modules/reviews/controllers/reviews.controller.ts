import { Controller, Get, Post, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../../core/guards/auth.guard";
import { RolesGuard } from "../../../core/guards/roles.guard";
import { Roles } from "../../../core/decorators/roles.decorator.decorator";

@Controller("reviews")
export class ReviewsController {
  @Get("negocio/:id")
  async getReviewsNegocio(@Param("id") id: string) {
    return { message: `GET /reviews/negocio/${id} - public skeleton` };
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("consumidor")
  async crearReview() {
    return { message: "POST /reviews - consumidor skeleton" };
  }
}
